from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email, User.deleted_at.is_(None)))
        return result.scalar_one_or_none()

    async def create(self, name: str, email: str, password_hash: str, **kwargs) -> User:
        user = User(name=name, email=email, password_hash=password_hash, **kwargs)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_verification_token(self, token: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email_verification_token == token))
        return result.scalar_one_or_none()

    async def get_by_reset_token(self, token: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.reset_password_token == token))
        return result.scalar_one_or_none()

    async def update(self, user: User) -> User:
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_by_id(self, user_id: int, updates: dict) -> Optional[User]:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        for key, value in updates.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        return user

    async def update_last_login(self, user_id: int):
        from datetime import datetime, timezone
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = datetime.now(timezone.utc)
            await self.db.flush()

    async def verify_email(self, user_id: int):
        user = await self.get_by_id(user_id)
        if user:
            user.email_verified = True
            user.email_verification_token = None
            await self.db.flush()
