from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.settings_repository import SettingsRepository


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.repo = SettingsRepository(db)

    async def get_settings(self, user_id: int) -> Dict:
        settings = await self.repo.get_by_user(user_id)
        if not settings:
            return {
                "theme": "dark",
                "accent_color": "#6366f1",
                "notifications_enabled": True,
                "language": "en",
                "animations_enabled": True,
                "privacy_mode": False,
                "auto_scan": True,
                "sound_enabled": True,
                "desktop_notifications": False,
                "alert_level": "all",
                "ai_detection_level": "balanced",
                "high_contrast": False,
                "font_size": "normal",
            }
        return {
            "theme": settings.theme,
            "accent_color": settings.accent_color,
            "notifications_enabled": settings.notifications_enabled,
            "language": settings.language,
            "animations_enabled": settings.animations_enabled,
            "privacy_mode": settings.privacy_mode,
            "auto_scan": settings.auto_scan,
            "sound_enabled": settings.sound_enabled,
            "desktop_notifications": settings.desktop_notifications,
            "alert_level": settings.alert_level,
            "ai_detection_level": settings.ai_detection_level,
            "high_contrast": settings.high_contrast,
            "font_size": settings.font_size,
        }

    async def update_settings(self, user_id: int, updates: Dict) -> Dict:
        await self.repo.upsert(user_id, updates)
        return await self.get_settings(user_id)
