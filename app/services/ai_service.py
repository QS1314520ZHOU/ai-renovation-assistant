import uuid
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import base64
from app.config import settings
from app.models.ai_session import AISession, AIMessage
from app.models.config import SystemConfig
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_client_factory import AIClientFactory

SYSTEM_PROMPTS = {
    "budget": """你是一位专业的装修顾问AI，帮助首次装修的业主收集房屋信息并生成预算。
你需要通过对话收集以下信息（按优先级排序）：
必填：城市、套内面积（或建筑面积）、户型（几室几厅）、装修档次
可选：楼层、房龄、地面偏好、卫生间数量、阳台数量、特殊需求（地暖、中央空调等）

每次回复末尾附加JSON块标记已收集的字段：
```json
{"city":"成都","inner_area":90,"layout_type":"三室两厅一卫","tier":"standard",...,"_complete":false,"_missing":["floor_preference"]}
```
当必填字段全部收集后，将 _complete 设为 true。""",
    "coach": """你是一位拥有20年工程经验的资深装修监理（AI教练）。
你的任务是耐心、专业地解答业主关于施工工艺、材料选用、验收标准等方面的问题。
请用通俗易懂的语言解释专业术语，不仅要指出问题，还要给出切实可行的避免/整改建议。
不需要输出JSON格式数据，直接回复文本即可。""",
    "freeqa": """你是一个专业的全能型装修助手。
你可以回答业主关于装修风格、灵感、家居搭配、以及任何与装修相关的日常问题。
请用热情、鼓励、且专业的口吻与用户交流。
不需要输出JSON格式数据，直接回复文本即可。"""
}

class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_client(self):
        return await AIClientFactory.get_client(self.db)

    async def chat(self, req: AIChatRequest, user_id: str) -> AIChatResponse:
        # 获取或创建会话
        if req.session_id:
            result = await self.db.execute(select(AISession).where(AISession.id == req.session_id))
            session = result.scalar_one_or_none()
        else:
            session = AISession(
                user_id=user_id,
                project_id=req.project_id,
                session_type=req.session_type,
            )
            self.db.add(session)
            await self.db.flush()

        # 获取历史消息
        msg_result = await self.db.execute(
            select(AIMessage)
            .where(AIMessage.session_id == session.id)
            .order_by(AIMessage.created_at)
        )
        history = msg_result.scalars().all()

        # 组装消息
        system_prompt = SYSTEM_PROMPTS.get(session.session_type, SYSTEM_PROMPTS["budget"])
        messages = [{"role": "system", "content": system_prompt}]
        for m in history:
            messages.append({"role": m.role, "content": m.content})
        messages.append({"role": "user", "content": req.message})

        # 保存用户消息
        self.db.add(AIMessage(session_id=session.id, role="user", content=req.message))

        # 调用 LLM (带 429 重试机制)
        import asyncio
        from openai import RateLimitError
        
        reply = ""
        max_retries = 3
        retry_delay = 2 # 初始延迟
        
        client = await self._get_client()
        for attempt in range(max_retries):
            try:
                response = await client.chat.completions.create(
                    model=(await self._get_config())["model"],
                    messages=messages,
                    temperature=0.3,
                    max_tokens=1000,
                )
                reply = response.choices[0].message.content
                break
            except RateLimitError as e:
                if attempt == max_retries - 1:
                    print(f"❌ AI 咨询触发频率限制 (429)，重试 {max_retries} 次后失败: {e}")
                    raise e
                wait_time = retry_delay * (2 ** attempt)
                print(f"⚠️ AI 咨询触发频率限制 (429)，将在 {wait_time}s 后重试 (第 {attempt + 1} 次)...")
                await asyncio.sleep(wait_time)
            except Exception as e:
                print(f"❌ AI 咨询发生未知错误: {e}")
                raise e

        # 保存 AI 回复
        self.db.add(AIMessage(session_id=session.id, role="assistant", content=reply))
        session.message_count = len(history) + 2
        await self.db.flush()

        # 解析提取字段 (仅限预算模式)
        if session.session_type == 'budget' or not session.session_type:
            extracted, is_complete, missing = self._parse_extracted(reply)
            session.extracted_fields = extracted
        else:
            extracted, is_complete, missing = session.extracted_fields or {}, False, []

        return AIChatResponse(
            session_id=session.id,
            reply=reply,
            extracted_fields=extracted,
            is_complete=is_complete,
            missing_fields=missing,
        )

    def _parse_extracted(self, reply: str) -> tuple[dict, bool, list]:
        import json, re
        match = re.search(r'```json\s*(\{.*?\})\s*```', reply, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                is_complete = data.pop("_complete", False)
                missing = data.pop("_missing", [])
                return data, is_complete, missing
            except json.JSONDecodeError:
                pass
        return {}, False, []

    async def get_messages(self, session_id: str):
        result = await self.db.execute(
            select(AIMessage)
            .where(AIMessage.session_id == session_id)
            .order_by(AIMessage.created_at)
        )
        return [{"role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in result.scalars().all()]

    async def inspect_photo(self, phase: str, items: str, file) -> str:
        """使用 Vision 模型分析施工照片"""
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        prompt = f"""你是一位资深的装修监理。请根据用户提供的【{phase}】阶段施工照片进行质量分析。
当前阶段的关键检查项包括：{items}

请在回复中包含以下内容：
1. 【验收结论】：整体施工质量评价（合格/存在风险/不合格）
2. 【发现的问题】：详细列出照片中识别出的施工瑕疵或违规点
3. 【整改建议】：针对发现的问题给出具体的加固或重新施工方案
4. 【避坑提醒】：提醒业主该阶段后续施工中最容易被偷工减料的地方

请用专业、客观、严谨的口吻回答。"""

        client = await self._get_client()
        cfg = await self._get_config()
        
        response = await client.chat.completions.create(
            model=cfg["model"],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file.content_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return response.choices[0].message.content
