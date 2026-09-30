from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.database.session import get_db
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    language: Optional[str] = None
    animations_enabled: Optional[bool] = None
    privacy_mode: Optional[bool] = None
    auto_scan: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    desktop_notifications: Optional[bool] = None
    alert_level: Optional[str] = None
    ai_detection_level: Optional[str] = None
    high_contrast: Optional[bool] = None
    font_size: Optional[str] = None


@router.get("/")
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SettingsService(db)
    return await service.get_settings(current_user.id)


@router.put("/")
async def update_settings(
    data: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SettingsService(db)
    return await service.update_settings(current_user.id, data.model_dump(exclude_none=True))
