import asyncio
import base64
import json
import logging
import re
from collections.abc import AsyncGenerator
from typing import Any

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI, RateLimitError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.ai_session import AIMessage, AISession
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_client_factory import AIClientFactory
from app.services.redis_service import RedisService

logger = logging.getLogger(__name__)

SUPPORTED_SESSION_TYPES = {"budget", "coach", "freeqa"}
AUTO_SESSION_TYPES = {"", "auto", "consult", "consultation", "chat"}
MAX_RETRY_PER_MODEL = 2

SYSTEM_PROMPTS = {
    "budget": """你是一位专业的装修顾问 AI，帮助首次装修的业主收集房屋信息并生成预算。
你需要通过对话收集以下信息（按优先级排序）：
必填：城市、套内面积（或建筑面积）、户型（几室几厅）、装修档次
可选：楼层、房龄、地面偏好、卫生间数量、阳台数量、特殊需求（地暖、中央空调等）

每次回复末尾附加 JSON 块标记已收集的字段：
```json
{"city":"成都","inner_area":90,"layout_type":"三室两厅一卫","tier":"standard",...,"_complete":false,"_missing":["floor_preference"]}
```
当必填字段全部收集后，将 `_complete` 设为 `true`。""",
    "coach": """你是一位拥有 20 年工程经验的资深装修监理（AI 教练）。
你的任务是耐心、专业地解答业主关于施工工艺、材料选用、验收标准等方面的问题。
请用通俗易懂的语言解释专业术语，不仅要指出问题，还要给出切实可行的避免/整改建议。
不需要输出 JSON 格式数据，直接回复文本即可。""",
    "freeqa": """你是一个专业的全能型装修助手。
你可以回答业主关于装修风格、灵感、家居搭配，以及任何与装修相关的日常问题。
请用热情、鼓励、且专业的口吻与用户交流。
不需要输出 JSON 格式数据，直接回复文本即可。""",
}

COMMON_CITY_NAMES = [
    "北京", "上海", "广州", "深圳", "杭州", "南京", "武汉", "成都", "重庆", "西安",
    "天津", "苏州", "宁波", "长沙", "郑州", "合肥", "青岛", "福州", "厦门", "东莞", "佛山",
    "无锡", "昆明", "南昌", "济南", "沈阳", "大连", "温州", "嘉兴", "绍兴", "珠海",
]

REQUIRED_BUDGET_FIELDS = {
    "city": "城市",
    "inner_area_or_building_area": "面积",
    "layout_type": "户型",
    "tier": "装修档次",
}

CHINESE_NUMBER_MAP = {
    "零": "0",
    "一": "1",
    "二": "2",
    "两": "2",
    "三": "3",
    "四": "4",
    "五": "5",
    "六": "6",
    "七": "7",
    "八": "8",
    "九": "9",
}


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_client(self) -> AsyncOpenAI:
        return await AIClientFactory.get_client(self.db)

    async def _get_config(self) -> dict[str, Any]:
        return await AIClientFactory.get_config(self.db)

    async def chat(self, req: AIChatRequest, user_id: str) -> AIChatResponse:
        session = await self._get_or_create_session(req, user_id)
        messages = await self._build_chat_messages(session, req.message)

        self.db.add(AIMessage(session_id=session.id, role="user", content=req.message))

        reply = ""
        model_used: str | None = None
        fallback_used = False
        upstream_error: Exception | None = None
        try:
            reply, model_used, fallback_used = await self._complete_with_fallback(
                messages=messages,
                temperature=0.3,
                max_tokens=1000,
            )
        except Exception as exc:
            upstream_error = exc
            logger.warning("AI chat call failed, fallback path may apply: %s", exc)

        final_reply, extracted_fields, is_complete, missing_fields = self._finalize_reply(
            session=session,
            user_message=req.message,
            reply=reply,
            upstream_error=upstream_error,
        )

        self.db.add(AIMessage(session_id=session.id, role="assistant", content=final_reply))
        session.message_count = int(session.message_count or 0) + 2
        await self.db.flush()
        await self._append_context_history(
            session.id,
            [{"role": "user", "content": req.message}, {"role": "assistant", "content": final_reply}],
        )

        return AIChatResponse(
            session_id=session.id,
            session_type=session.session_type or "budget",
            reply=final_reply,
            extracted_fields=extracted_fields,
            is_complete=is_complete,
            missing_fields=missing_fields,
            model_used=model_used,
            fallback_used=fallback_used,
        )

    async def chat_stream(self, req: AIChatRequest, user_id: str) -> AsyncGenerator[dict[str, Any], None]:
        session = await self._get_or_create_session(req, user_id)
        messages = await self._build_chat_messages(session, req.message)
        self.db.add(AIMessage(session_id=session.id, role="user", content=req.message))

        reply_parts: list[str] = []
        model_used: str | None = None
        fallback_used = False
        upstream_error: Exception | None = None

        try:
            stream, model_used, fallback_used = await self._open_stream_with_fallback(
                messages=messages,
                temperature=0.3,
                max_tokens=1000,
            )
            yield {"type": "start", "session_id": str(session.id), "model": model_used}
            async for chunk in stream:
                delta = self._extract_stream_delta(chunk)
                if not delta:
                    continue
                reply_parts.append(delta)
                yield {"type": "chunk", "content": delta}
        except Exception as exc:
            upstream_error = exc
            logger.warning("AI stream call failed: %s", exc)

        try:
            raw_reply = "".join(reply_parts).strip()
            final_reply, extracted_fields, is_complete, missing_fields = self._finalize_reply(
                session=session,
                user_message=req.message,
                reply=raw_reply,
                upstream_error=upstream_error,
            )
            if final_reply and final_reply != raw_reply:
                delta = final_reply[len(raw_reply):] if final_reply.startswith(raw_reply) else final_reply
                for piece in self._chunk_text(delta, int(settings.AI_STREAM_CHUNK_CHARS or 48)):
                    yield {"type": "chunk", "content": piece}

            self.db.add(AIMessage(session_id=session.id, role="assistant", content=final_reply))
            session.message_count = int(session.message_count or 0) + 2
            await self.db.flush()
            await self._append_context_history(
                session.id,
                [{"role": "user", "content": req.message}, {"role": "assistant", "content": final_reply}],
            )

            yield {
                "type": "done",
                "session_id": str(session.id),
                "session_type": session.session_type or "budget",
                "reply": final_reply,
                "extracted_fields": extracted_fields,
                "is_complete": is_complete,
                "missing_fields": missing_fields,
                "model_used": model_used,
                "fallback_used": fallback_used,
            }
        except Exception as exc:
            logger.exception("AI stream finalize failed: %s", exc)
            yield {"type": "error", "message": str(exc) if settings.DEBUG else "AI服务暂时不可用"}

    async def _get_or_create_session(self, req: AIChatRequest, user_id: str) -> AISession:
        session = None
        if req.session_id:
            result = await self.db.execute(
                select(AISession).where(
                    AISession.id == req.session_id,
                    AISession.user_id == user_id,
                )
            )
            session = result.scalar_one_or_none()
            if not session:
                logger.warning("AI chat session not found or mismatched, creating a new session: %s", req.session_id)

        if session:
            session.session_type = self._resolve_session_type(
                requested_type=req.session_type,
                message=req.message,
                previous_type=session.session_type,
            )
            return session

        session = AISession(
            user_id=user_id,
            project_id=req.project_id,
            session_type=self._resolve_session_type(req.session_type, req.message, None),
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def _build_chat_messages(self, session: AISession, user_message: str) -> list[dict[str, str]]:
        history = await self._load_context_history(session.id)
        dialog_messages = history + [{"role": "user", "content": user_message}]
        dialog_messages = self._trim_messages_by_limits(dialog_messages)
        system_prompt = SYSTEM_PROMPTS.get(session.session_type, SYSTEM_PROMPTS["budget"])
        return [{"role": "system", "content": system_prompt}, *dialog_messages]

    async def _load_context_history(self, session_id: Any) -> list[dict[str, str]]:
        cache_key = self._context_cache_key(session_id)
        cached = await RedisService.get_json(cache_key)
        cached_messages = self._sanitize_history_messages(cached if isinstance(cached, list) else [])
        if cached_messages:
            return self._trim_messages_by_limits(cached_messages)

        msg_result = await self.db.execute(
            select(AIMessage)
            .where(AIMessage.session_id == session_id)
            .order_by(AIMessage.created_at)
        )
        db_messages = [
            {"role": item.role, "content": item.content}
            for item in msg_result.scalars().all()
            if item.role in {"user", "assistant"} and item.content
        ]
        trimmed = self._trim_messages_by_limits(db_messages)
        await RedisService.set_json(
            cache_key,
            trimmed,
            ttl_seconds=int(settings.AI_CONTEXT_CACHE_TTL_SECONDS or 21600),
        )
        return trimmed

    async def _append_context_history(
        self,
        session_id: Any,
        new_messages: list[dict[str, str]],
    ) -> None:
        cache_key = self._context_cache_key(session_id)
        existing = await RedisService.get_json(cache_key)
        history = self._sanitize_history_messages(existing if isinstance(existing, list) else [])
        history.extend(self._sanitize_history_messages(new_messages))
        trimmed = self._trim_messages_by_limits(history)
        await RedisService.set_json(
            cache_key,
            trimmed,
            ttl_seconds=int(settings.AI_CONTEXT_CACHE_TTL_SECONDS or 21600),
        )

    def _context_cache_key(self, session_id: Any) -> str:
        return f"ai:context:{session_id}"

    def _sanitize_history_messages(self, raw_messages: list[Any]) -> list[dict[str, str]]:
        normalized: list[dict[str, str]] = []
        for item in raw_messages:
            if not isinstance(item, dict):
                continue
            role = str(item.get("role") or "").strip().lower()
            content = str(item.get("content") or "").strip()
            if role not in {"user", "assistant"} or not content:
                continue
            normalized.append({"role": role, "content": content})
        return normalized

    def _trim_messages_by_limits(self, messages: list[dict[str, str]]) -> list[dict[str, str]]:
        if not messages:
            return []

        max_messages = max(1, int(settings.AI_MAX_HISTORY_MESSAGES or 20))
        max_tokens = max(512, int(settings.AI_MAX_CONTEXT_TOKENS or 6000))
        recent_messages = messages[-max_messages:]
        kept: list[dict[str, str]] = []
        used_tokens = 0

        for message in reversed(recent_messages):
            content = str(message.get("content") or "")
            estimated_tokens = self._estimate_tokens(content) + 4

            if kept and used_tokens + estimated_tokens > max_tokens:
                break

            if not kept and estimated_tokens > max_tokens:
                kept.append(
                    {
                        "role": message["role"],
                        "content": self._trim_text_to_token_budget(content, max_tokens),
                    }
                )
                break

            kept.append({"role": message["role"], "content": content})
            used_tokens += estimated_tokens

        return list(reversed(kept))

    def _estimate_tokens(self, text: str) -> int:
        if not text:
            return 0

        chinese_chars = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")
        other_chars = len(text) - chinese_chars
        return max(1, int(chinese_chars * 1.5 + other_chars * 0.25))

    def _trim_text_to_token_budget(self, text: str, token_budget: int) -> str:
        if not text or token_budget <= 0:
            return ""

        used_tokens = 0.0
        kept_chars: list[str] = []
        for ch in reversed(text):
            token_cost = 1.5 if "\u4e00" <= ch <= "\u9fff" else 0.25
            if kept_chars and used_tokens + token_cost > token_budget:
                break
            if not kept_chars and token_cost > token_budget:
                kept_chars.append(ch)
                break
            kept_chars.append(ch)
            used_tokens += token_cost

        return "".join(reversed(kept_chars))

    async def _complete_with_fallback(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> tuple[str, str, bool]:
        candidates = await AIClientFactory.get_model_candidates(self.db)
        last_error: Exception | None = None

        for index, candidate in enumerate(candidates):
            client = AIClientFactory.build_client(candidate)
            model_name = candidate["model"]
            for attempt in range(MAX_RETRY_PER_MODEL):
                try:
                    response = await client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    reply = self._extract_reply_text(response)
                    if not reply:
                        raise RuntimeError("AI returned an empty response")
                    if index > 0:
                        logger.warning("AI model fallback succeeded: %s", model_name)
                    return reply, model_name, index > 0
                except Exception as exc:
                    last_error = exc
                    if self._is_retryable_error(exc) and attempt < MAX_RETRY_PER_MODEL - 1:
                        wait_time = 2 * (2 ** attempt)
                        await asyncio.sleep(wait_time)
                        continue
                    logger.warning(
                        "AI model call failed model=%s attempt=%s err=%s",
                        model_name,
                        attempt + 1,
                        exc,
                    )
                    break

        raise last_error or RuntimeError("AI service unavailable")

    async def _open_stream_with_fallback(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> tuple[Any, str, bool]:
        candidates = await AIClientFactory.get_model_candidates(self.db)
        last_error: Exception | None = None

        for index, candidate in enumerate(candidates):
            client = AIClientFactory.build_client(candidate)
            model_name = candidate["model"]
            for attempt in range(MAX_RETRY_PER_MODEL):
                try:
                    stream = await client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=True,
                    )
                    if index > 0:
                        logger.warning("AI stream fallback succeeded: %s", model_name)
                    return stream, model_name, index > 0
                except Exception as exc:
                    last_error = exc
                    if self._is_retryable_error(exc) and attempt < MAX_RETRY_PER_MODEL - 1:
                        wait_time = 2 * (2 ** attempt)
                        await asyncio.sleep(wait_time)
                        continue
                    logger.warning(
                        "AI stream failed model=%s attempt=%s err=%s",
                        model_name,
                        attempt + 1,
                        exc,
                    )
                    break

        raise last_error or RuntimeError("AI stream unavailable")

    def _is_retryable_error(self, exc: Exception) -> bool:
        if isinstance(exc, (RateLimitError, APIConnectionError, APITimeoutError)):
            return True
        if isinstance(exc, APIStatusError):
            return getattr(exc, "status_code", None) in {429, 500, 502, 503, 504}
        return False

    def _extract_stream_delta(self, chunk: Any) -> str:
        choices = getattr(chunk, "choices", None) or []
        if not choices:
            return ""

        delta = getattr(choices[0], "delta", None)
        if not delta:
            return ""

        if isinstance(delta, dict):
            content = delta.get("content")
        else:
            content = getattr(delta, "content", None)

        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for part in content:
                if isinstance(part, dict):
                    text = part.get("text") or part.get("content")
                else:
                    text = getattr(part, "text", None) or getattr(part, "content", None)
                if text:
                    parts.append(str(text))
            return "".join(parts)
        return str(content or "")

    def _chunk_text(self, text: str, chunk_size: int) -> list[str]:
        if not text:
            return []
        size = max(1, chunk_size)
        return [text[i:i + size] for i in range(0, len(text), size)]

    def _finalize_reply(
        self,
        session: AISession,
        user_message: str,
        reply: str,
        upstream_error: Exception | None,
    ) -> tuple[str, dict[str, Any], bool, list[str]]:
        budget_mode = session.session_type == "budget"
        previous_fields = session.extracted_fields or {}

        if budget_mode:
            parsed_fields, parsed_complete, _ = self._parse_extracted(reply) if reply else ({}, False, [])
            heuristic_fields = self._extract_budget_fields(user_message)
            extracted_fields = self._merge_budget_fields(previous_fields, parsed_fields)
            extracted_fields = self._merge_budget_fields(extracted_fields, heuristic_fields)
            extracted_fields = self._apply_area_estimate(extracted_fields)

            is_complete = parsed_complete or self._budget_fields_complete(extracted_fields)
            missing_fields = self._missing_budget_fields(extracted_fields)
            if reply:
                if "```json" not in reply.lower():
                    reply = self._append_budget_json(reply, extracted_fields, is_complete, missing_fields)
            else:
                reply = self._build_budget_fallback_reply(extracted_fields, missing_fields, upstream_error)
            session.extracted_fields = extracted_fields
            return reply, extracted_fields, is_complete, missing_fields

        if not reply:
            raise upstream_error or RuntimeError("AI service unavailable")

        extracted_fields = session.extracted_fields or {}
        return reply, extracted_fields, False, []

    def _resolve_session_type(self, requested_type: str | None, message: str, previous_type: str | None) -> str:
        requested = self._normalize_session_type(requested_type)
        previous = self._normalize_session_type(previous_type)

        if requested in SUPPORTED_SESSION_TYPES:
            return requested
        if previous in SUPPORTED_SESSION_TYPES:
            return previous
        routed = self._classify_intent(message)
        logger.info("AI chat auto-routed session type: %s", routed)
        return routed

    def _normalize_session_type(self, value: str | None) -> str:
        if value is None:
            return ""
        normalized = str(value).strip().lower()
        if normalized in AUTO_SESSION_TYPES:
            return "auto"
        return normalized

    def _classify_intent(self, message: str) -> str:
        text = (message or "").strip().lower()
        if not text:
            return "budget"

        budget_strong_keywords = (
            "预算", "多少钱", "花费", "费用", "总价", "报价",
            "单价", "超支", "控制在", "大概要花",
        )
        budget_info_keywords = ("面积", "平米", "户型", "档次", "套内", "建面")
        coach_keywords = (
            "施工", "验收", "空鼓", "闭水", "打压", "渗水", "漏水",
            "贴砖", "找平", "水电", "开槽", "防水", "工艺", "节点",
        )
        freeqa_keywords = (
            "风格", "配色", "软装", "灵感", "案例", "搭配",
            "效果图", "家具", "灯光", "窗帘", "收纳",
            "简约", "奶油", "北欧", "中式", "轻奢", "美式",
        )

        budget_strong_hits = [keyword for keyword in budget_strong_keywords if keyword in text]
        budget_info_hits = [keyword for keyword in budget_info_keywords if keyword in text]
        coach_hits = [keyword for keyword in coach_keywords if keyword in text]
        freeqa_hits = [keyword for keyword in freeqa_keywords if keyword in text]

        if budget_strong_hits:
            routed = "budget"
        elif coach_hits:
            routed = "coach"
        elif freeqa_hits:
            routed = "freeqa"
        elif budget_info_hits:
            routed = "budget"
        else:
            routed = "budget"

        logger.info(
            "AI intent routed=%s hits=%s",
            routed,
            {
                "budget_strong": budget_strong_hits,
                "budget_info": budget_info_hits,
                "coach": coach_hits,
                "freeqa": freeqa_hits,
                "message_length": len(text),
            },
        )
        return routed

    def _parse_extracted(self, reply: str) -> tuple[dict[str, Any], bool, list[str]]:
        match = re.search(r"```json\s*(\{.*?\})\s*```", reply, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                is_complete = bool(data.pop("_complete", False))
                missing = data.pop("_missing", [])
                return data, is_complete, missing if isinstance(missing, list) else []
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI extracted json block")
        return {}, False, []

    def _extract_reply_text(self, response: Any) -> str:
        choices = getattr(response, "choices", None) or []
        if not choices:
            return ""

        message = getattr(choices[0], "message", None)
        content = getattr(message, "content", None)

        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for part in content:
                if isinstance(part, dict):
                    text = part.get("text") or part.get("content")
                else:
                    text = getattr(part, "text", None) or getattr(part, "content", None)
                if text:
                    parts.append(str(text))
            return "\n".join(parts).strip()
        return str(content or "").strip()

    def _extract_budget_fields(self, message: str) -> dict[str, Any]:
        text = (message or "").strip()
        if not text:
            return {}

        normalized = self._normalize_chinese_numbers(text)
        fields: dict[str, Any] = {}

        city = self._extract_city(normalized)
        if city:
            fields["city"] = city

        area_fields = self._extract_area(normalized)
        fields.update(area_fields)

        layout = self._extract_layout(normalized)
        if layout:
            fields["layout_type"] = layout

        tier = self._extract_tier(normalized)
        if tier:
            fields["tier"] = tier

        target_budget = self._extract_budget_amount(normalized)
        if target_budget is not None:
            fields["target_budget"] = target_budget

        floor_preference = self._extract_floor_preference(normalized)
        if floor_preference:
            fields["floor_preference"] = floor_preference

        bathroom_count = self._extract_count(normalized, r"(\d)\s*(?:卫|卫生间)")
        if bathroom_count:
            fields["bathroom_count"] = bathroom_count

        balcony_count = self._extract_count(normalized, r"(\d)\s*(?:阳台|阳台数)")
        if balcony_count:
            fields["balcony_count"] = balcony_count

        return fields

    def _extract_city(self, text: str) -> str | None:
        for city in COMMON_CITY_NAMES:
            if city in text:
                return city
        match = re.search(r"([一-龥]{2,6})(?:市|州|盟)", text)
        if match:
            return match.group(1)
        return None

    def _extract_area(self, text: str) -> dict[str, float]:
        result: dict[str, float] = {}
        inner_match = re.search(r"(?:套内|使用|室内)\s*(?:面积)?\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:㎡|平米|平方|平|m2)", text, re.IGNORECASE)
        if inner_match:
            result["inner_area"] = float(inner_match.group(1))
            return result
        building_match = re.search(r"(?:建筑|建面)\s*(?:面积)?\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:㎡|平米|平方|平|m2)", text, re.IGNORECASE)
        if building_match:
            result["building_area"] = float(building_match.group(1))
            return result
        generic_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:㎡|平米|平方|平|m2)", text, re.IGNORECASE)
        if generic_match:
            result["inner_area"] = float(generic_match.group(1))
        return result

    def _extract_layout(self, text: str) -> str | None:
        match = re.search(r"(\d)\s*[室房]\s*(\d)\s*[厅]\s*(\d)\s*[卫]", text)
        if match:
            return f"{match.group(1)}室{match.group(2)}厅{match.group(3)}卫"
        match = re.search(r"(\d)\s*[室房]\s*(\d)\s*[厅]", text)
        if match:
            return f"{match.group(1)}室{match.group(2)}厅1卫"
        match = re.search(r"(\d)\s*[居卧]\s*(\d)\s*[厅]", text)
        if match:
            return f"{match.group(1)}室{match.group(2)}厅1卫"
        return None

    def _extract_tier(self, text: str) -> str | None:
        if any(keyword in text for keyword in ["简装", "出租", "省钱", "低配"]):
            return "economy"
        if any(keyword in text for keyword in ["高端", "豪装", "品质", "轻奢", "改善"]):
            return "premium"
        if any(keyword in text for keyword in ["标准", "普通", "刚需", "现代简约"]):
            return "standard"
        return None

    def _extract_budget_amount(self, text: str) -> int | None:
        match = re.search(r"(?:预算|控制在|总价|花费)\D{0,6}(\d+(?:\.\d+)?)\s*(万|w|W|元)?", text)
        if not match:
            return None
        amount = float(match.group(1))
        unit = (match.group(2) or "").lower()
        if unit in {"万", "w"}:
            return round(amount * 10000)
        if amount < 1000:
            return round(amount * 10000)
        return round(amount)

    def _extract_floor_preference(self, text: str) -> str | None:
        has_wood = any(keyword in text for keyword in ["木地板", "木纹", "地板"])
        has_tile = any(keyword in text for keyword in ["瓷砖", "地砖", "瓷片"])
        if has_wood and has_tile:
            return "mixed"
        if has_wood:
            return "wood"
        if has_tile:
            return "tile"
        if "混合" in text or "混搭" in text:
            return "mixed"
        return None

    def _extract_count(self, text: str, pattern: str) -> int | None:
        match = re.search(pattern, text)
        if not match:
            return None
        return int(match.group(1))

    def _apply_area_estimate(self, fields: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(fields)
        inner_area = normalized.get("inner_area")
        building_area = normalized.get("building_area")
        if not inner_area and building_area:
            normalized["inner_area"] = round(float(building_area) / 1.22, 1)
            normalized["area_estimated_from_building_area"] = True
        return normalized

    def _merge_budget_fields(self, base: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
        merged = dict(base or {})
        for key, value in (incoming or {}).items():
            if value is None:
                continue
            if isinstance(value, str) and not value.strip():
                continue
            if isinstance(value, list) and not value:
                continue
            merged[key] = value
        return merged

    def _budget_fields_complete(self, fields: dict[str, Any]) -> bool:
        return bool(fields.get("city") and fields.get("inner_area") and fields.get("layout_type") and fields.get("tier"))

    def _missing_budget_fields(self, fields: dict[str, Any]) -> list[str]:
        missing: list[str] = []
        if not fields.get("city"):
            missing.append("city")
        if not fields.get("inner_area") and not fields.get("building_area"):
            missing.append("inner_area_or_building_area")
        if not fields.get("layout_type"):
            missing.append("layout_type")
        if not fields.get("tier"):
            missing.append("tier")
        return missing

    def _append_budget_json(
        self,
        reply: str,
        fields: dict[str, Any],
        is_complete: bool,
        missing_fields: list[str],
    ) -> str:
        payload = dict(fields)
        payload["_complete"] = is_complete
        payload["_missing"] = missing_fields
        return f"{reply.rstrip()}\n\n```json\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n```"

    def _build_budget_fallback_reply(
        self,
        fields: dict[str, Any],
        missing_fields: list[str],
        upstream_error: Exception | None,
    ) -> str:
        intro = "这次 AI 模型没有稳定返回，我先根据你刚才的话帮你整理一版关键信息。"
        if upstream_error:
            logger.warning("AI chat switched to local fallback: %s", upstream_error)

        summary_lines = []
        if fields.get("city"):
            summary_lines.append(f"- 城市：{fields['city']}")
        if fields.get("inner_area"):
            area_line = f"- 面积：套内 {fields['inner_area']} ㎡"
            if fields.get("area_estimated_from_building_area") and fields.get("building_area"):
                area_line += f"（由建筑面积 {fields['building_area']} ㎡按 82% 估算）"
            summary_lines.append(area_line)
        elif fields.get("building_area"):
            summary_lines.append(f"- 面积：建筑面积 {fields['building_area']} ㎡")
        if fields.get("layout_type"):
            summary_lines.append(f"- 户型：{fields['layout_type']}")
        if fields.get("tier"):
            summary_lines.append(f"- 装修档次：{fields['tier']}")
        if fields.get("target_budget"):
            summary_lines.append(f"- 目标预算：{fields['target_budget']} 元")
        if fields.get("floor_preference"):
            summary_lines.append(f"- 地面偏好：{fields['floor_preference']}")
        if not summary_lines:
            summary_lines.append("- 我还没有从这句话里识别出稳定的预算字段。")

        if missing_fields:
            missing_text = "、".join(REQUIRED_BUDGET_FIELDS.get(key, key) for key in missing_fields)
            guidance = f"\n\n还缺少：{missing_text}。你继续补一句，我就能继续往下整理。"
        else:
            guidance = "\n\n关键信息已经齐了，你现在可以直接生成预算。"

        payload = dict(fields)
        payload["_complete"] = not missing_fields
        payload["_missing"] = missing_fields
        return (
            f"{intro}\n\n"
            + "\n".join(summary_lines)
            + guidance
            + f"\n\n```json\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n```"
        )

    def _normalize_chinese_numbers(self, text: str) -> str:
        normalized = text
        for chinese, digit in CHINESE_NUMBER_MAP.items():
            normalized = normalized.replace(chinese, digit)
        return normalized

    async def get_messages(self, session_id: str) -> list[dict[str, str]]:
        result = await self.db.execute(
            select(AIMessage)
            .where(AIMessage.session_id == session_id)
            .order_by(AIMessage.created_at)
        )
        return [{"role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in result.scalars().all()]

    async def inspect_photo(self, phase: str, items: str, file: Any) -> str:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        prompt = f"""你是一位资深的装修监理。请根据用户提供的【{phase}】阶段施工照片进行质量分析。
当前阶段的关键检查项包括：{items}

请在回复中包含以下内容：
1. 【验收结论】：整体施工质量评价（合格/存在风险/不合格）
2. 【发现的问题】：详细列出照片中识别出的施工瑕疵或违规点
3. 【整改建议】：针对发现的问题给出具体的加固或重新施工方案
4. 【避坑提醒】：提醒业主该阶段后续施工中最容易被偷工减料的地方

请用专业、客观、严谨的口吻回答。"""

        cfg = await self._get_config()
        client = await self._get_client()
        response = await client.chat.completions.create(
            model=cfg["model"],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{base64_image}"}},
                    ],
                }
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return self._extract_reply_text(response)
