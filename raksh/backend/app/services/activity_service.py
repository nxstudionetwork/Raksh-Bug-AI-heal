from typing import Dict, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.activity_repository import ActivityRepository


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.repo = ActivityRepository(db)

    async def log_activity(self, user_id: int, action: str, resource: Optional[str] = None,
                           resource_id: Optional[int] = None, details: dict = None):
        return await self.repo.create(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details or {},
        )

    async def get_recent_activity(self, user_id: int, limit: int = 20):
        return await self.repo.list_by_user(user_id, limit=limit)
