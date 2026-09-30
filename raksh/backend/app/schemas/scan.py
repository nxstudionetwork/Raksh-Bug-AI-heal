from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class ScanResultResponse(BaseModel):
    id: int
    user_id: int
    message_id: int
    risk_score: float
    spam_score: float
    scam_score: float
    phishing_score: float
    confidence: float
    threat_category: str
    severity: str
    explanation: Optional[str] = None
    recommendation: Optional[str] = None
    suggested_actions: list = []
    detected_keywords: list = []
    psychological_tactics: dict = {}
    threat_intel_matches: list = []
    url_analyses: list = []
    processing_time_ms: int
    model_version: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ScanHistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    scans: List[ScanResultResponse]


class ScanStatsResponse(BaseModel):
    total_scans: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    safe_count: int
    avg_risk_score: float
    top_threats: List[dict] = []
    scans_by_day: List[dict] = []
    recent_scans: List[ScanResultResponse] = []
