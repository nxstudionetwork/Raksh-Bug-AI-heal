from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.connected_app_repository import ConnectedAppRepository
from app.connectors import connector_registry
from app.utils.websocket_manager import ws_manager
from app.utils.logger import logger


class ConnectedAppService:
    def __init__(self, db: AsyncSession):
        self.repo = ConnectedAppRepository(db)

    async def list_apps(self, user_id: int):
        return await self.repo.list_by_user(user_id)

    async def connect_app(self, user_id: int, platform: str, permissions: dict = None):
        app = await self.repo.create(
            user_id=user_id,
            platform=platform,
            status="connected",
            permissions=permissions or {},
            monitoring_enabled=True,
        )
        await ws_manager.send_personal_message(user_id, "app_connected", {"app_id": app.id, "platform": platform})
        return app

    async def disconnect_app(self, app_id: int, user_id: int):
        app = await self.repo.disconnect(app_id, user_id)
        if app:
            connector_registry.remove_instance(app.platform.value, app.id)
            await ws_manager.send_personal_message(user_id, "app_disconnected", {"app_id": app_id})
        return app

    async def toggle_monitoring(self, app_id: int, user_id: int, enabled: bool):
        return await self.repo.update(app_id, user_id, {"monitoring_enabled": enabled})

    async def sync_app(self, app_id: int, user_id: int):
        app = await self.repo.get(app_id, user_id)
        if not app:
            return None
        connector = connector_registry.get_instance(app.platform.value, app.id, user_id)
        if connector:
            result = await connector.sync()
            await self.repo.update_last_sync(app_id, user_id)
            return result
        return {"messages_fetched": 0, "error": "Connector not available"}

    async def health_check(self, app_id: int, user_id: int):
        app = await self.repo.get(app_id, user_id)
        if not app:
            return None
        connector = connector_registry.get_instance(app.platform.value, app.id, user_id)
        if connector:
            return await connector.health_check()
        return {"status": "unknown", "platform": app.platform.value if app.platform else "unknown"}
