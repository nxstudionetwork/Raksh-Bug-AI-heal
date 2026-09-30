from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    email_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)


class SettingsResponse(BaseModel):
    theme: str = "dark"
    accent_color: str = "#6366f1"
    notifications_enabled: bool = True
    language: str = "en"
    animations_enabled: bool = True
    privacy_mode: bool = False
    auto_scan: bool = True
    sound_enabled: bool = True
    desktop_notifications: bool = False
    alert_level: str = "all"
    ai_detection_level: str = "balanced"
    high_contrast: bool = False
    font_size: str = "normal"


class DashboardStats(BaseModel):
    total_scans: int = 0
    threats_blocked: int = 0
    safe_messages: int = 0
    active_threats: int = 0
    health_score: int = 87
    scans_today: int = 0
    critical_alerts: int = 0
    connected_apps: int = 0
    recent_activity: list = []
    trending_threats: list = []
