import uuid
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class ContractRiskItem(BaseModel):
    category: str
    risk_level: str
    original_text: Optional[str] = None
    risk_point: str
    suggestion: str

class ContractRiskReportOut(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    project_id: uuid.UUID
    overall_score: int
    risk_count_high: int
    risk_count_medium: int
    risk_count_low: int
    risks: List[ContractRiskItem] = []
    payment_terms: Dict[str, Any] = {}
    recommendations: List[str] = []
    ai_summary: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
