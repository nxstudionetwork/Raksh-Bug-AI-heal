from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import ActivityLog


class ActivityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, action: str, resource: Optional[str] = None,
                     resource_id: Optional[int] = None, details: dict = None) -> ActivityLog:
        log = ActivityLog(
            user_id=user_id, action=action, resource=resource,
            resource_id=resource_id, details=details or {},
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_by_user(self, user_id: int, limit: int = 20) -> List[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog).where(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def count_by_user(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count(ActivityLog.id)).where(ActivityLog.user_id == user_id)
        )
        return result.scalar() or 0
