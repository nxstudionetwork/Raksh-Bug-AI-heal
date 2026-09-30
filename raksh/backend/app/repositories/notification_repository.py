from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import select, func, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import Notification, NotificationStatus


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, type: str, severity: str, title: str,
                     description: Optional[str] = None, source: Optional[str] = None,
                     metadata: dict = None) -> Notification:
        notif = Notification(
            user_id=user_id, type=type, severity=severity,
            title=title, description=description, source=source,
            metadata_json=metadata or {},
        )
        self.db.add(notif)
        await self.db.flush()
        return notif

    async def list_by_user(self, user_id: int, skip: int = 0, limit: int = 50,
                           notif_type: Optional[str] = None,
                           search: Optional[str] = None) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if notif_type and notif_type != "all":
            query = query.where(Notification.type == notif_type)
        if search:
            query = query.where(
                Notification.title.ilike(f"%{search}%") |
                Notification.description.ilike(f"%{search}%")
            )
        query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_by_user(self, user_id: int, notif_type: Optional[str] = None,
                            search: Optional[str] = None) -> int:
        query = select(func.count(Notification.id)).where(Notification.user_id == user_id)
        if notif_type and notif_type != "all":
            query = query.where(Notification.type == notif_type)
        if search:
            query = query.where(
                Notification.title.ilike(f"%{search}%") |
                Notification.description.ilike(f"%{search}%")
            )
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def count_unread(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.status == NotificationStatus.UNREAD
            )
        )
        return result.scalar() or 0

    async def mark_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        notif = result.scalar_one_or_none()
        if notif:
            notif.status = NotificationStatus.READ
            notif.read_at = datetime.now(timezone.utc)
            await self.db.flush()
        return notif

    async def mark_all_read(self, user_id: int) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.status == NotificationStatus.UNREAD
            )
            .values(
                status=NotificationStatus.READ,
                read_at=datetime.now(timezone.utc)
            )
        )
        await self.db.flush()
        return result.rowcount

    async def delete(self, notification_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            delete(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        await self.db.flush()
        return result.rowcount > 0

    async def clear_all(self, user_id: int) -> int:
        result = await self.db.execute(
            delete(Notification).where(Notification.user_id == user_id)
        )
        await self.db.flush()
        return result.rowcount
