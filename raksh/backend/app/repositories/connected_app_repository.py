from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import ConnectedApp, AppPlatform


class ConnectedAppRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, platform: str, status: str = "connected",
                     permissions: dict = None, monitoring_enabled: bool = True,
                     account_email: str = None, **kwargs) -> ConnectedApp:
        app = ConnectedApp(
            user_id=user_id, platform=platform, status=status,
            permissions=permissions or {}, monitoring_enabled=monitoring_enabled,
            account_email=account_email,
        )
        self.db.add(app)
        await self.db.flush()
        return app

    async def get(self, app_id: int, user_id: int) -> Optional[ConnectedApp]:
        result = await self.db.execute(
            select(ConnectedApp).where(ConnectedApp.id == app_id, ConnectedApp.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, app_id: int) -> Optional[ConnectedApp]:
        result = await self.db.execute(
            select(ConnectedApp).where(ConnectedApp.id == app_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int) -> List[ConnectedApp]:
        result = await self.db.execute(
            select(ConnectedApp).where(ConnectedApp.user_id == user_id).order_by(ConnectedApp.created_at.desc())
        )
        return result.scalars().all()

    async def list_all_active(self) -> List[ConnectedApp]:
        result = await self.db.execute(
            select(ConnectedApp).where(
                ConnectedApp.status == "connected",
                ConnectedApp.monitoring_enabled == True
            ).order_by(ConnectedApp.user_id)
        )
        return result.scalars().all()

    async def update(self, app_id: int, user_id: int, updates: dict) -> Optional[ConnectedApp]:
        app = await self.get(app_id, user_id)
        if not app:
            return None
        for key, value in updates.items():
            if hasattr(app, key):
                setattr(app, key, value)
        await self.db.flush()
        return app

    async def disconnect(self, app_id: int, user_id: int) -> Optional[ConnectedApp]:
        return await self.update(app_id, user_id, {"status": "disconnected", "monitoring_enabled": False})

    async def get_by_user_and_platform(self, user_id: int, platform: str) -> Optional[ConnectedApp]:
        result = await self.db.execute(
            select(ConnectedApp).where(
                ConnectedApp.user_id == user_id,
                ConnectedApp.platform == platform
            )
        )
        return result.scalar_one_or_none()

    async def update_app(self, app: ConnectedApp) -> ConnectedApp:
        await self.db.flush()
        await self.db.refresh(app)
        return app

    async def delete_app(self, app: ConnectedApp) -> bool:
        await self.db.delete(app)
        await self.db.flush()
        return True

    async def update_last_sync(self, app_id: int, user_id: int) -> Optional[ConnectedApp]:
        return await self.update(app_id, user_id, {"last_sync": datetime.now(timezone.utc)})
