import base64
import json
import logging
import re
import statistics
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.price_snapshot import PriceAdjustmentSuggestion, PriceSnapshot
from app.models.pricing import CityFactor, PricingRule, PricingStandardItem
from app.models.project import RenovationProject
from app.models.quote import QuoteItem, QuoteUpload
from app.services.ai_client_factory import AIClientFactory

logger = logging.getLogger(__name__)


MATERIAL_KEYWORDS: dict[str, list[str]] = {
    "SI_FLOOR_TILE_MAT": ["地砖", "釉面砖", "通体砖", "抛光砖", "玻化砖", "800x800"],
    "SI_WALL_TILE_MAT": ["墙砖", "瓷片", "内墙砖", "300x600"],
    "SI_WALL_PAINT": ["乳胶漆", "内墙涂料", "腻子粉"],
    "SI_WATERPROOF": ["防水涂料", "聚氨酯防水", "JS防水", "柔性防水"],
    "SI_CEILING_LIVING": ["石膏板", "纸面石膏板", "轻钢龙骨"],
    "SI_CEILING_KW": ["集成吊顶", "铝扣板"],
    "SI_DOOR": ["室内门", "实木复合门", "免漆门", "生态门"],
    "SI_FLOOR_WOOD": ["强化复合地板", "实木复合地板", "三层实木"],
    "SI_CABINET_KITCHEN": ["橱柜", "整体橱柜", "石英石台面"],
    "SI_CUSTOM_WARDROBE": ["定制柜", "全屋定制", "衣柜", "颗粒板", "多层实木板"],
    "SI_SANITARY": ["马桶", "花洒套装", "浴室柜"],
}


class PriceSyncService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def sync_from_zjtcn(self, city_code: str, year: int, month: int) -> int:
        token = (settings.ZJTCN_API_TOKEN or "").strip()
        if not token:
            logger.warning("Skip zjtcn sync, ZJTCN_API_TOKEN is empty")
            return 0

        city_factor = await self._get_city_factor(city_code)
        if not city_factor:
            logger.warning("Skip zjtcn sync, city_factor not found: %s", city_code)
            return 0

        snapshot_date = self._safe_month_date(year, month)
        base_url = "https://api.zjtcn.com/open/api"
        count = 0

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                journal_resp = await client.post(
                    f"{base_url}/infoPrice/journal",
                    json={
                        "token": token,
                        "province": city_factor.province,
                        "city": city_factor.city_name,
                        "year": str(year),
                        "month": str(month),
                        "industry": "房屋建筑与装饰工程",
                    },
                )
                journal_resp.raise_for_status()
                journal_data = journal_resp.json()
                journal_list = (
                    (journal_data.get("data") or {}).get("list", [])
                    if isinstance(journal_data, dict)
                    else []
                )
                for item in journal_list:
                    if not isinstance(item, dict):
                        continue
                    price = self._to_float(item.get("price"))
                    if price <= 0:
                        continue
                    material_name = str(item.get("materialName") or "")
                    self.db.add(
                        PriceSnapshot(
                            source="zjtcn_info_price",
                            city_code=city_code,
                            standard_item_code=self._match_keyword(material_name),
                            raw_material_name=material_name,
                            raw_spec=str(item.get("spec") or ""),
                            raw_unit=str(item.get("unit") or ""),
                            raw_price=price,
                            price_type="material",
                            snapshot_date=snapshot_date,
                            raw_json=item,
                        )
                    )
                    count += 1
            except Exception as exc:
                logger.error("zjtcn info price sync failed city=%s error=%s", city_code, exc)

            for std_code, keywords in MATERIAL_KEYWORDS.items():
                for keyword in keywords[:2]:
                    try:
                        ref_resp = await client.post(
                            f"{base_url}/referencePrice/match",
                            json={
                                "token": token,
                                "province": city_factor.province,
                                "materials": [{"materialName": keyword, "unit": ""}],
                            },
                        )
                        ref_resp.raise_for_status()
                        ref_data = ref_resp.json()
                        if not isinstance(ref_data, dict) or ref_data.get("code") != 200:
                            continue
                        for mat in ref_data.get("data", []):
                            if not isinstance(mat, dict):
                                continue
                            for price_item in mat.get("priceList", []):
                                if not isinstance(price_item, dict):
                                    continue
                                price = self._to_float(price_item.get("price"))
                                if price <= 0:
                                    continue
                                self.db.add(
                                    PriceSnapshot(
                                        source="zjtcn_ref_price",
                                        city_code=city_code,
                                        standard_item_code=std_code,
                                        raw_material_name=str(
                                            price_item.get("materialName") or keyword
                                        ),
                                        raw_spec=str(price_item.get("spec") or ""),
                                        raw_unit=str(price_item.get("unit") or ""),
                                        raw_price=price,
                                        price_type="material",
                                        snapshot_date=date.today(),
                                        raw_json=price_item,
                                    )
                                )
                                count += 1
                    except Exception as exc:
                        logger.error(
                            "zjtcn reference price sync failed city=%s keyword=%s error=%s",
                            city_code,
                            keyword,
                            exc,
                        )

        await self.db.flush()
        logger.info("zjtcn sync done city=%s count=%s", city_code, count)
        return count

    async def sync_from_gov_pdf(
        self, pdf_url: str, city_code: str, year: int, month: int
    ) -> int:
        if not pdf_url:
            logger.warning("Skip gov pdf sync, pdf_url is empty")
            return 0

        count = 0
        snapshot_date = self._safe_month_date(year, month)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(pdf_url)
                resp.raise_for_status()
                pdf_bytes = resp.content

            pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
            ai_client = await AIClientFactory.get_client(self.db)
            ai_config = await AIClientFactory.get_config(self.db)

            prompt = (
                "请从这份建设工程造价信息文档中提取装修相关材料价格。\n"
                "只提取类别：瓷砖、乳胶漆、防水涂料、木地板、石膏板、水泥、河沙、管材线缆。\n"
                "输出 JSON 数组，字段为 name/spec/unit/price/price_type。"
                "price_type 只允许 material 或 labor，只输出 JSON。"
            )

            response = await ai_client.chat.completions.create(
                model=ai_config["model"],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:application/pdf;base64,{pdf_b64}"
                                },
                            },
                        ],
                    }
                ],
                temperature=0.1,
                max_tokens=4000,
            )

            raw_text = self._normalize_ai_content(response.choices[0].message.content)
            payload = self._extract_json_payload(raw_text)
            if not isinstance(payload, list):
                logger.warning("gov pdf parse got invalid payload: %s", type(payload))
                return 0

            for item in payload:
                if not isinstance(item, dict):
                    continue
                price = self._to_float(item.get("price"))
                if price <= 0:
                    continue
                name = str(item.get("name") or "")
                self.db.add(
                    PriceSnapshot(
                        source="gov_pdf",
                        city_code=city_code,
                        standard_item_code=self._match_keyword(name),
                        raw_material_name=name,
                        raw_spec=str(item.get("spec") or ""),
                        raw_unit=str(item.get("unit") or ""),
                        raw_price=price,
                        price_type=str(item.get("price_type") or "material"),
                        snapshot_date=snapshot_date,
                        raw_json=item,
                    )
                )
                count += 1

            await self.db.flush()
            logger.info("gov pdf sync done city=%s count=%s", city_code, count)
            return count
        except Exception as exc:
            logger.error("gov pdf sync failed city=%s url=%s error=%s", city_code, pdf_url, exc)
            return 0

    async def sync_from_ecommerce(self, city_code: str = "510100") -> int:
        query_map: dict[str, list[dict[str, Any]]] = {
            "SI_FLOOR_TILE_MAT": [
                {"keyword": "地砖 800x800 客厅", "unit": "㎡", "convert": lambda p: p / 3},
                {"keyword": "通体砖 600x600", "unit": "㎡", "convert": lambda p: p / 4},
            ],
            "SI_WALL_PAINT": [
                {"keyword": "乳胶漆 5L 内墙", "unit": "㎡", "convert": lambda p: p / 50}
            ],
            "SI_FLOOR_WOOD": [
                {"keyword": "实木复合地板 三层", "unit": "㎡", "convert": lambda p: p},
                {"keyword": "强化复合地板", "unit": "㎡", "convert": lambda p: p},
            ],
            "SI_DOOR": [
                {"keyword": "实木复合门 室内门 含门套", "unit": "樘", "convert": lambda p: p},
                {"keyword": "免漆门 生态门", "unit": "樘", "convert": lambda p: p},
            ],
            "SI_SANITARY": [
                {"keyword": "马桶 虹吸式", "unit": "个", "convert": lambda p: p},
                {"keyword": "花洒套装 恒温", "unit": "套", "convert": lambda p: p},
            ],
        }

        count = 0
        try:
            ai_client = await AIClientFactory.get_client(self.db)
            ai_config = await AIClientFactory.get_config(self.db)
        except Exception as exc:
            logger.error("ecommerce sync skipped, ai client init failed: %s", exc)
            return 0

        current_year = date.today().year
        for std_code, queries in query_map.items():
            for query in queries:
                keyword = str(query["keyword"])
                try:
                    prompt = (
                        f"请给出 {current_year} 年中国主流电商平台（京东/天猫）中，"
                        f"关键词“{keyword}”的大致价格区间。\n"
                        "请只输出 JSON，格式如下：\n"
                        "{"
                        '"keyword":"...",'
                        '"price_low":0,'
                        '"price_median":0,'
                        '"price_high":0,'
                        '"unit":"...",'
                        '"sample_brands":["A","B"],'
                        '"confidence":"high/medium/low"'
                        "}"
                    )
                    response = await ai_client.chat.completions.create(
                        model=ai_config["model"],
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.2,
                        max_tokens=500,
                    )
                    raw_text = self._normalize_ai_content(response.choices[0].message.content)
                    payload = self._extract_json_payload(raw_text)
                    if not isinstance(payload, dict):
                        continue
                    for level, key in (
                        ("low", "price_low"),
                        ("median", "price_median"),
                        ("high", "price_high"),
                    ):
                        raw = self._to_float(payload.get(key))
                        if raw <= 0:
                            continue
                        converted = float(query["convert"](raw))
                        self.db.add(
                            PriceSnapshot(
                                source="ecommerce_ai",
                                city_code=city_code,
                                standard_item_code=std_code,
                                raw_material_name=keyword,
                                raw_spec=f"price_level={level}",
                                raw_unit=str(query["unit"]),
                                raw_price=round(converted, 2),
                                price_type="material",
                                snapshot_date=date.today(),
                                raw_json=payload,
                            )
                        )
                        count += 1
                except Exception as exc:
                    logger.error(
                        "ecommerce sync failed city=%s keyword=%s error=%s",
                        city_code,
                        keyword,
                        exc,
                    )

        await self.db.flush()
        logger.info("ecommerce sync done city=%s count=%s", city_code, count)
        return count

    async def sync_from_user_quotes(self, months: int = 3) -> int:
        cutoff = datetime.now(timezone.utc) - timedelta(days=months * 30)
        count = 0

        std_rows = await self.db.execute(select(PricingStandardItem.id, PricingStandardItem.code))
        std_map = {row[0]: row[1] for row in std_rows.all()}

        quote_rows = await self.db.execute(
            select(QuoteItem, QuoteUpload, RenovationProject.city_code)
            .join(QuoteUpload, QuoteItem.quote_id == QuoteUpload.id)
            .join(RenovationProject, QuoteUpload.project_id == RenovationProject.id, isouter=True)
            .where(QuoteUpload.created_at > cutoff)
            .where(QuoteItem.matched_std_id.isnot(None))
            .where(QuoteItem.unit_price.isnot(None))
            .where(QuoteItem.unit_price > 0)
        )

        for quote_item, quote_upload, project_city_code in quote_rows.all():
            std_code = std_map.get(quote_item.matched_std_id)
            if not std_code:
                continue

            city_code = project_city_code or "510100"
            snapshot_day = (
                quote_upload.created_at.date() if quote_upload.created_at else date.today()
            )
            unit_price = self._to_float(quote_item.unit_price)
            if unit_price <= 0:
                continue

            self.db.add(
                PriceSnapshot(
                    source="user_quote",
                    city_code=city_code,
                    standard_item_code=std_code,
                    raw_material_name=str(quote_item.original_name or ""),
                    raw_spec="",
                    raw_unit=str(quote_item.unit or ""),
                    raw_price=unit_price,
                    price_type="total",
                    snapshot_date=snapshot_day,
                    raw_json={
                        "quote_id": str(quote_upload.id),
                        "quote_item_id": str(quote_item.id),
                        "quantity": self._to_float(quote_item.quantity),
                        "total_price": self._to_float(quote_item.total_price),
                    },
                )
            )
            count += 1

        await self.db.flush()
        logger.info("user quote sync done months=%s count=%s", months, count)
        return count

    async def aggregate_and_suggest(self, city_code: str = "510100") -> int:
        recent_cutoff = date.today() - timedelta(days=90)
        threshold = abs(float(settings.PRICE_DEVIATION_THRESHOLD or 0.15))
        suggestions_count = 0

        std_rows = await self.db.execute(
            select(PricingStandardItem.id, PricingStandardItem.code).where(
                PricingStandardItem.is_active == True
            )
        )
        std_id_to_code = {row[0]: row[1] for row in std_rows.all()}
        if not std_id_to_code:
            return 0

        rules_rows = await self.db.execute(
            select(PricingRule).where(
                PricingRule.city_code == city_code, PricingRule.is_active == True
            )
        )
        current_rules: dict[tuple[str, str], PricingRule] = {}
        for rule in rules_rows.scalars().all():
            std_code = std_id_to_code.get(rule.standard_item_id)
            if std_code:
                current_rules[(std_code, rule.tier)] = rule

        snapshot_rows = await self.db.execute(
            select(PriceSnapshot)
            .where(PriceSnapshot.city_code == city_code)
            .where(PriceSnapshot.standard_item_code.isnot(None))
            .where(PriceSnapshot.snapshot_date >= recent_cutoff)
            .where(PriceSnapshot.raw_price > 0)
        )

        grouped: dict[str, list[PriceSnapshot]] = defaultdict(list)
        for snapshot in snapshot_rows.scalars().all():
            if snapshot.standard_item_code:
                grouped[snapshot.standard_item_code].append(snapshot)

        existing_rows = await self.db.execute(
            select(PriceAdjustmentSuggestion).where(
                PriceAdjustmentSuggestion.city_code == city_code,
                PriceAdjustmentSuggestion.status == "pending",
            )
        )
        existing_pending = {
            (item.standard_item_code, item.tier): item for item in existing_rows.scalars().all()
        }

        source_weights = {
            "zjtcn_info_price": 1.5,
            "zjtcn_ref_price": 1.3,
            "gov_pdf": 1.4,
            "user_quote": 1.2,
            "ecommerce_ai": 0.8,
        }

        for std_code, snapshots in grouped.items():
            if len(snapshots) < 3:
                continue

            weighted_prices: list[tuple[float, float]] = []
            source_breakdown: dict[str, list[float]] = defaultdict(list)
            for snapshot in snapshots:
                price = self._to_float(snapshot.raw_price)
                if price <= 0:
                    continue
                weight = source_weights.get(snapshot.source, 1.0)
                weighted_prices.append((price, weight))
                source_breakdown[snapshot.source].append(price)

            if len(weighted_prices) < 3:
                continue

            weighted_prices.sort(key=lambda item: item[0])
            total_weight = sum(item[1] for item in weighted_prices) or 1.0
            cumulative_weight = 0.0
            weighted_median = weighted_prices[0][0]
            for price, weight in weighted_prices:
                cumulative_weight += weight
                if cumulative_weight >= total_weight / 2:
                    weighted_median = price
                    break

            plain_prices = [item[0] for item in weighted_prices]
            tier_prices = {
                "economy": self._percentile(plain_prices, 25),
                "standard": weighted_median,
                "premium": self._percentile(plain_prices, 80),
            }

            for tier, suggested_total in tier_prices.items():
                rule = current_rules.get((std_code, tier))
                if not rule:
                    continue

                current_material = self._to_float(rule.material_unit_price)
                current_labor = self._to_float(rule.labor_unit_price)
                current_accessory = self._to_float(rule.accessory_unit_price)
                current_total = current_material + current_labor + current_accessory
                if current_total <= 0:
                    continue

                deviation = (suggested_total - current_total) / current_total
                if abs(deviation) <= threshold:
                    continue

                mat_ratio = current_material / current_total if current_total else 0.6
                labor_ratio = current_labor / current_total if current_total else 0.4

                source_stats = {
                    src: {
                        "count": len(values),
                        "avg": round(statistics.mean(values), 2),
                        "min": round(min(values), 2),
                        "max": round(max(values), 2),
                    }
                    for src, values in source_breakdown.items()
                    if values
                }

                existing = existing_pending.get((std_code, tier))
                if existing:
                    existing.current_material_price = current_material
                    existing.current_labor_price = current_labor
                    existing.suggested_material_price = round(suggested_total * mat_ratio, 2)
                    existing.suggested_labor_price = round(suggested_total * labor_ratio, 2)
                    existing.deviation_pct = round(deviation * 100, 2)
                    existing.sample_count = len(weighted_prices)
                    existing.sources_json = source_stats
                    suggestions_count += 1
                    continue

                self.db.add(
                    PriceAdjustmentSuggestion(
                        city_code=city_code,
                        standard_item_code=std_code,
                        tier=tier,
                        current_material_price=current_material,
                        current_labor_price=current_labor,
                        suggested_material_price=round(suggested_total * mat_ratio, 2),
                        suggested_labor_price=round(suggested_total * labor_ratio, 2),
                        deviation_pct=round(deviation * 100, 2),
                        sample_count=len(weighted_prices),
                        sources_json=source_stats,
                        status="pending",
                    )
                )
                suggestions_count += 1

        await self.db.flush()
        logger.info(
            "aggregate and suggest done city=%s threshold=%.2f suggestions=%s",
            city_code,
            threshold,
            suggestions_count,
        )
        return suggestions_count

    async def apply_suggestion(
        self, suggestion_id: uuid.UUID, reviewer_id: uuid.UUID
    ) -> dict[str, Any]:
        suggestion_row = await self.db.execute(
            select(PriceAdjustmentSuggestion).where(
                PriceAdjustmentSuggestion.id == suggestion_id
            )
        )
        suggestion = suggestion_row.scalar_one_or_none()
        if not suggestion or suggestion.status != "pending":
            return {"error": "建议不存在或已处理"}

        std_row = await self.db.execute(
            select(PricingStandardItem).where(
                PricingStandardItem.code == suggestion.standard_item_code
            )
        )
        std_item = std_row.scalar_one_or_none()
        if not std_item:
            return {"error": "标准项不存在"}

        rule_row = await self.db.execute(
            select(PricingRule).where(
                PricingRule.city_code == suggestion.city_code,
                PricingRule.standard_item_id == std_item.id,
                PricingRule.tier == suggestion.tier,
                PricingRule.is_active == True,
            )
        )
        rule = rule_row.scalar_one_or_none()
        if not rule:
            return {"error": "定价规则不存在"}

        old_info = (
            f"旧价: 材{self._to_float(rule.material_unit_price):.2f}/"
            f"工{self._to_float(rule.labor_unit_price):.2f}"
        )

        rule.material_unit_price = self._to_float(suggestion.suggested_material_price)
        rule.labor_unit_price = self._to_float(suggestion.suggested_labor_price)
        rule.price_source = f"auto_sync_{date.today().isoformat()}"
        rule.remark = old_info
        rule.effective_date = date.today()

        suggestion.status = "approved"
        suggestion.reviewed_by = reviewer_id
        suggestion.reviewed_at = datetime.now(timezone.utc)

        await self.db.flush()
        logger.info(
            "applied suggestion city=%s code=%s tier=%s",
            suggestion.city_code,
            suggestion.standard_item_code,
            suggestion.tier,
        )
        return {"success": True, "applied": old_info}

    async def run_full_sync(
        self, city_code: str = "510100", gov_pdf_url: Optional[str] = None
    ) -> dict[str, int]:
        today = date.today()
        result: dict[str, int] = {}
        result["zjtcn"] = await self.sync_from_zjtcn(city_code, today.year, today.month)
        if gov_pdf_url:
            result["gov_pdf"] = await self.sync_from_gov_pdf(
                gov_pdf_url, city_code, today.year, today.month
            )
        else:
            result["gov_pdf"] = 0
        result["ecommerce"] = await self.sync_from_ecommerce(city_code)
        result["user_quotes"] = await self.sync_from_user_quotes(months=3)
        result["suggestions"] = await self.aggregate_and_suggest(city_code)
        await self.db.flush()
        logger.info("run_full_sync done city=%s result=%s", city_code, result)
        return result

    def _match_keyword(self, material_name: str) -> Optional[str]:
        lowered = (material_name or "").lower().strip()
        for code, keywords in MATERIAL_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in lowered:
                    return code
        return None

    def _percentile(self, values: list[float], pct: int) -> float:
        if not values:
            return 0.0
        sorted_values = sorted(values)
        index = int(len(sorted_values) * pct / 100)
        index = max(0, min(index, len(sorted_values) - 1))
        return float(sorted_values[index])

    async def _get_city_factor(self, city_code: str) -> Optional[CityFactor]:
        result = await self.db.execute(
            select(CityFactor).where(CityFactor.city_code == city_code)
        )
        return result.scalar_one_or_none()

    def _extract_json_payload(self, text: str) -> Any:
        if not text:
            return None

        fenced_match = re.search(r"```json\s*(.*?)\s*```", text, flags=re.DOTALL)
        if fenced_match:
            try:
                return json.loads(fenced_match.group(1))
            except Exception:
                pass

        generic_fence_match = re.search(r"```\s*(.*?)\s*```", text, flags=re.DOTALL)
        if generic_fence_match:
            try:
                return json.loads(generic_fence_match.group(1))
            except Exception:
                pass

        stripped = text.strip()
        try:
            return json.loads(stripped)
        except Exception:
            pass

        object_match = re.search(r"(\{.*\})", stripped, flags=re.DOTALL)
        if object_match:
            try:
                return json.loads(object_match.group(1))
            except Exception:
                pass

        list_match = re.search(r"(\[.*\])", stripped, flags=re.DOTALL)
        if list_match:
            try:
                return json.loads(list_match.group(1))
            except Exception:
                pass

        return None

    def _normalize_ai_content(self, content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    text = item.get("text")
                    if text:
                        parts.append(str(text))
            return "\n".join(parts)
        return str(content or "")

    def _to_float(self, value: Any) -> float:
        if value is None:
            return 0.0
        try:
            return float(value)
        except Exception:
            return 0.0

    def _safe_month_date(self, year: int, month: int) -> date:
        try:
            return date(year, month, 1)
        except ValueError:
            return date.today().replace(day=1)
