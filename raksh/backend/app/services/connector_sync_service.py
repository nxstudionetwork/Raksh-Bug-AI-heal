import asyncio
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import async_session_factory
from app.connectors import connector_registry
from app.repositories.connected_app_repository import ConnectedAppRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.activity_repository import ActivityRepository
from app.utils.logger import logger


class ConnectorSyncService:
    POLL_INTERVAL = 30
    MAX_MESSAGES_PER_SYNC = 10

    def __init__(self):
        self._shutdown = asyncio.Event()

    async def sync_connector(self, app, db: AsyncSession):
        msg_repo = MessageRepository(db)
        act_repo = ActivityRepository(db)
        config = app.metadata_json or {}
        connector = connector_registry.get_instance(
            app.platform.value, app.id, app.user_id, config
        )
        if not connector:
            logger.warning(f"No connector found for {app.platform.value} (app_id={app.id})")
            return

        try:
            if not connector.is_connected:
                await connector.connect()

            health = await connector.health_check()
            if health.get("status") != "healthy":
                logger.warning(f"Connector {app.platform.value} health check failed: {health}")
                return

            messages = await connector.fetch_messages(limit=self.MAX_MESSAGES_PER_SYNC)
            for msg_data in messages:
                await msg_repo.create(
                    user_id=app.user_id,
                    connected_app_id=app.id,
                    source=msg_data.get("source", app.platform.value),
                    sender=msg_data.get("sender", "unknown"),
                    receiver=msg_data.get("receiver", "me"),
                    subject=msg_data.get("subject", ""),
                    message_content=msg_data.get("message_content", ""),
                    attachments=msg_data.get("attachments", []),
                    urls=msg_data.get("urls", []),
                )

            app.last_sync = datetime.now(timezone.utc)
            app.error_count = 0
            await db.flush()

            if messages:
                logger.info(f"Synced {len(messages)} messages from {app.platform.value} (user={app.user_id})")

        except Exception as e:
            app.error_count = (app.error_count or 0) + 1
            logger.error(f"Sync failed for {app.platform.value} (app_id={app.id}): {e}")

    async def sync_all_connectors(self):
        async with async_session_factory() as db:
            app_repo = ConnectedAppRepository(db)
            apps = await app_repo.list_all_active()
            for app in apps:
                if self._shutdown.is_set():
                    break
                await self.sync_connector(app, db)
            await db.commit()

    async def run_forever(self):
        logger.info("Connector sync service started — polling every 30s")
        while not self._shutdown.is_set():
            try:
                await self.sync_all_connectors()
            except Exception as e:
                logger.error(f"Connector sync cycle failed: {e}")
            try:
                await asyncio.wait_for(
                    self._shutdown.wait(),
                    timeout=self.POLL_INTERVAL,
                )
                break
            except asyncio.TimeoutError:
                continue

    async def shutdown(self):
        self._shutdown.set()


connector_sync_service = ConnectorSyncService()

async def run_connector_sync():
    await connector_sync_service.run_forever()

async def shutdown_connector_sync():
    await connector_sync_service.shutdown()
