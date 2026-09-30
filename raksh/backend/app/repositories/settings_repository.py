from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import UserSettings


class SettingsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: int) -> Optional[UserSettings]:
        result = await self.db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, user_id: int, updates: dict) -> UserSettings:
        result = await self.db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()
        if settings:
            for key, value in updates.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
        else:
            settings = UserSettings(user_id=user_id, **updates)
            self.db.add(settings)
        await self.db.flush()
        return settings
