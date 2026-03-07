import uuid
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.ai_session import AISession, AIMessage
from app.models.config import SystemConfig
from app.schemas.ai import AIChatRequest, AIChatResponse

SYSTEM_PROMPT = """你是一位专业的装修顾问AI，帮助首次装修的业主收集房屋信息并生成预算。
你需要通过对话收集以下信息（按优先级排序）：
必填：城市、套内面积（或建筑面积）、户型（几室几厅）、装修档次
可选：楼层、房龄、地面偏好、卫生间数量、阳台数量、特殊需求（地暖、中央空调等）

每次回复末尾附加JSON块标记已收集的字段：
```json
{"city":"成都","inner_area":90,"layout_type":"三室两厅一卫","tier":"standard",...,"_complete":false,"_missing":["floor_preference"]}
```
当必填字段全部收集后，将 _complete 设为 true。"""

class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._client = None
        self._config = None

    async def _get_config(self):
        """获取AI配置：优先从数据库读取，其次从环境变量读取"""
        if self._config:
            return self._config
        
        result = await self.db.execute(select(SystemConfig).where(SystemConfig.key == "ai_config", SystemConfig.is_active == True))
        cfg_record = result.scalar_one_or_none()
        
        if cfg_record:
            # 格式兼容前端传入的数据结构
            # value: { "activeModelId": "xxx", "aiModels": [{ "id": "xxx", "baseUrl": "...", "apiKey": "...", "models": ["..."] }] }
            val = cfg_record.value
            active_id = val.get("activeModelId")
            models = val.get("aiModels", [])
            active_model = next((m for m in models if m["id"] == active_id), None) if active_id else (models[0] if models else None)
            
            if active_model:
                self._config = {
                    "base_url": active_model.get("baseUrl"),
                    "api_key": active_model.get("apiKey"),
                    "model": active_model.get("models")[0] if active_model.get("models") else settings.AI_MODEL
                }
                return self._config

        # Fallback
        self._config = {
            "base_url": settings.AI_BASE_URL,
            "api_key": settings.AI_API_KEY,
            "model": settings.AI_MODEL
        }
        return self._config

    async def _get_client(self):
        if self._client:
            return self._client
        
        cfg = await self._get_config()
        self._client = AsyncOpenAI(
            base_url=cfg["base_url"],
            api_key=cfg["api_key"],
        )
        return self._client

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
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
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

        # 解析提取字段
        extracted, is_complete, missing = self._parse_extracted(reply)
        session.extracted_fields = extracted

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
