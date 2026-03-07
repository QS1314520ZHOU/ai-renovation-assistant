import uuid
import json
import re
import base64
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.contract import ContractUpload, ContractRiskReport
from app.services.ai_client_factory import AIClientFactory

CONTRACT_PARSE_PROMPT = """你是一个专业的中国室内装修合同审核律师。请将以下装修合同内容进行分析，并提取核心条款风险，输出为结构化JSON格式。

要求提取和分析以下内容：
1. **付款比例 (payment_terms)**: 提取各阶段的付款比例（如开工、水电、泥瓦、竣工）。行业常规健康比例为【开工30%-水电30%-泥瓦30%-竣工10%】。如果首付过高（>40%）或中期过早结清，需要标记风险。
2. **增项约定 (add_on_terms)**: 合同中是否有“增项不超过合同总价5%”或类似限制。如果没有，属于中/高风险。
3. **延期违约金 (delay_terms)**: 是否明确了工期以及延期后的赔偿标准（如每日赔付千分之几）。如果不明确或赔偿极低，属于风险。
4. **质保条款 (warranty_terms)**: 是否明确了水电隐蔽工程质保（法定5年）和其他表面工程（法定2年）。如果不达法定标准，属于高风险。
5. **风险点列表 (risks)**: 列出具体风险点。
6. **综合打分 (score)**: 给这份合同打个分（满分100）。

输出格式：
```json
{
  "score": 85,
  "payment_terms": {
    "details": "开工40%，水电40%，竣工20%",
    "is_healthy": false,
    "analysis": "首期及中期付款偏高，竣工尾款偏高，但无过程节点，属于轻度度风险"
  },
  "risks": [
    {
      "category": "付款比例",
      "risk_level": "medium", 
      "original_text": "合同开工进场支付40%...",
      "risk_point": "前期付款比例过高，对业主约束力下降",
      "suggestion": "建议协商修改为：开工30%，水电30%，木工瓦工25%，竣工15%"
    }
  ],
  "recommendations": [
    "建议在附件中补充：所有增项必须经业主签字确认，且总增项金额不得超过合同总价的5%"
  ],
  "summary": "这份合同整体较为标准，但在付款节奏和增项约束上偏向施工方，建议补充限制条款。"
}
```

以下是合同内容：
"""

class ContractService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_client(self):
        return await AIClientFactory.get_client(self.db)

    async def _get_config(self):
        return await AIClientFactory.get_config(self.db)

    def _extract_json(self, text: str) -> dict:
        match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        return {}

    async def upload_and_parse(self, project_id: uuid.UUID, file):
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        client = await self._get_client()
        cfg = await self._get_config()
        
        try:
            parse_result = await client.chat.completions.create(
                model=cfg["model"],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": CONTRACT_PARSE_PROMPT},
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
                max_tokens=4000,
            )
            raw_content = parse_result.choices[0].message.content
            json_data = self._extract_json(raw_content)
            
            if not json_data:
                return {"error": "Failed to parse contract image content"}

            return await self._save_and_report(project_id, json_data, "image_upload")
        except Exception as e:
            return {"error": str(e)}

    async def check_from_text(self, project_id: uuid.UUID, text: str):
        client = await self._get_client()
        cfg = await self._get_config()
        
        try:
            parse_result = await client.chat.completions.create(
                model=cfg["model"],
                messages=[
                    {"role": "system", "content": CONTRACT_PARSE_PROMPT},
                    {"role": "user", "content": text},
                ],
                temperature=0.3,
            )
            
            raw_content = parse_result.choices[0].message.content
            json_data = self._extract_json(raw_content)
            
            if not json_data:
                return {"error": "Failed to parse contract text content"}

            return await self._save_and_report(project_id, json_data, "text_input")
        except Exception as e:
            return {"error": str(e)}

    async def _save_and_report(self, project_id: uuid.UUID, json_data: dict, source: str):
        upload = ContractUpload(
            project_id=project_id,
            file_url=source,
            file_name="合同解析",
            ocr_status="completed",
            parsed_data=json_data
        )
        self.db.add(upload)
        await self.db.flush()

        risks = json_data.get("risks", [])
        high = sum(1 for r in risks if str(r.get("risk_level")).lower() == "high")
        medium = sum(1 for r in risks if str(r.get("risk_level")).lower() == "medium")
        low = sum(1 for r in risks if str(r.get("risk_level")).lower() == "low")

        report = ContractRiskReport(
            contract_id=upload.id,
            project_id=project_id,
            overall_score=json_data.get("score", 100),
            risk_count_high=high,
            risk_count_medium=medium,
            risk_count_low=low,
            risks_json=risks,
            payment_terms_json=json_data.get("payment_terms", {}),
            recommendations_json=json_data.get("recommendations", []),
            ai_summary=json_data.get("summary", "")
        )
        self.db.add(report)
        await self.db.commit()

        return {
            "contract_id": str(upload.id),
            "report_id": str(report.id),
            "score": report.overall_score,
            "risks": {"high": high, "medium": medium, "low": low},
            "summary": report.ai_summary
        }

    async def get_report(self, report_id: uuid.UUID):
        result = await self.db.execute(select(ContractRiskReport).where(ContractRiskReport.id == report_id))
        return result.scalar_one_or_none()
