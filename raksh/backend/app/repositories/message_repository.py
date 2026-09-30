from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database.models import Message


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, source: str, sender: str, receiver: str,
                     message_content: str, subject: Optional[str] = None,
                     connected_app_id: Optional[int] = None,
                     attachments: list = None, urls: list = None) -> Message:
        msg = Message(
            user_id=user_id, source=source, sender=sender, receiver=receiver,
            subject=subject, message_content=message_content,
            connected_app_id=connected_app_id,
            attachments=attachments or [], urls=urls or [],
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def get_by_id(self, message_id: int) -> Optional[Message]:
        result = await self.db.execute(
            select(Message).where(Message.id == message_id)
        )
        return result.scalar_one_or_none()

    async def get_unprocessed(self, limit: int = 10) -> List[Message]:
        result = await self.db.execute(
            select(Message).where(Message.processed == False)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .options(selectinload(Message.scan_result))
        )
        return result.scalars().all()

    async def mark_processed(self, message: Message):
        message.processed = True
        await self.db.flush()

    async def list_by_user(self, user_id: int, skip: int = 0, limit: int = 50, source: Optional[str] = None) -> List[Message]:
        query = select(Message).where(Message.user_id == user_id)
        if source and source != "all":
            query = query.where(Message.source == source)
        query = query.order_by(Message.received_time.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_by_user(self, user_id: int, source: Optional[str] = None) -> int:
        query = select(func.count(Message.id)).where(Message.user_id == user_id)
        if source and source != "all":
            query = query.where(Message.source == source)
        result = await self.db.execute(query)
        return result.scalar() or 0
