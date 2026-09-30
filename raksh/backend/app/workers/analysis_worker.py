import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import async_session_factory
from app.repositories.message_repository import MessageRepository
from app.repositories.scan_repository import ScanRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.notification_service import NotificationService
from app.ai.pipeline import pipeline
from app.utils.websocket_manager import ws_manager
from app.utils.logger import logger


class AnalysisWorker:
    POLL_INTERVAL = 5
    MAX_CONCURRENT = 3
    MAX_RETRIES = 3
    BASE_BACKOFF = 2

    def __init__(self):
        self._shutdown = asyncio.Event()
        self._semaphore = asyncio.Semaphore(self.MAX_CONCURRENT)
        self._retry_counts = {}

    async def process_message(self, msg, msg_repo, scan_repo, notif_service):
        async with self._semaphore:
            try:
                result = await pipeline.analyze(
                    message_content=msg.message_content,
                    subject=msg.subject or "",
                )

                scan = await scan_repo.create(
                    user_id=msg.user_id,
                    message_id=msg.id,
                    risk_score=result["risk_score"],
                    spam_score=result["spam_score"],
                    scam_score=result["scam_score"],
                    phishing_score=result["phishing_score"],
                    confidence=result["confidence"],
                    threat_category=result["threat_category"],
                    severity=result["severity"],
                    explanation=result["explanation"],
                    recommendation=result["recommendation"],
                    suggested_actions=result.get("suggested_actions", []),
                    detected_keywords=result.get("detected_keywords", []),
                    psychological_tactics=result.get("psychological_tactics", {}),
                    threat_intel_matches=result.get("threat_intel_matches", []),
                    url_analyses=result.get("url_analyses", []),
                    processing_time_ms=result["processing_time_ms"],
                    model_version=result["model_version"],
                )

                await msg_repo.mark_processed(msg)

                notif = await notif_service.create_scan_notification(
                    user_id=msg.user_id,
                    scan_result=result,
                    message_preview=msg.message_content[:100],
                )

                await ws_manager.send_personal_message(
                    msg.user_id,
                    "scan_complete",
                    {
                        "scan_id": scan.id,
                        "risk_score": result["risk_score"],
                        "severity": result["severity"],
                        "threat_category": result["threat_category"],
                        "suggested_actions": result.get("suggested_actions", []),
                    },
                )

                logger.info(
                    f"Processed message {msg.id} for user {msg.user_id}: "
                    f"risk={result['risk_score']}, category={result['threat_category']}"
                )
                self._retry_counts.pop(msg.id, None)
                return True

            except Exception as e:
                retries = self._retry_counts.get(msg.id, 0) + 1
                self._retry_counts[msg.id] = retries
                if retries < self.MAX_RETRIES:
                    backoff = self.BASE_BACKOFF ** retries
                    logger.warning(
                        f"Retrying message {msg.id} (attempt {retries}/{self.MAX_RETRIES}) "
                        f"after {backoff}s: {e}"
                    )
                    await asyncio.sleep(backoff)
                    return await self.process_message(msg, msg_repo, scan_repo, notif_service)
                logger.error(f"Failed to process message {msg.id} after {self.MAX_RETRIES} attempts: {e}")
                self._retry_counts.pop(msg.id, None)
                return False

    async def process_pending_messages(self):
        async with async_session_factory() as db:
            msg_repo = MessageRepository(db)
            scan_repo = ScanRepository(db)
            notif_service = NotificationService(db)

            messages = await msg_repo.get_unprocessed(limit=10)
            for msg in messages:
                if self._shutdown.is_set():
                    break
                try:
                    await self.process_message(msg, msg_repo, scan_repo, notif_service)
                    await db.commit()
                except Exception as e:
                    await db.rollback()
                    logger.error(f"Message {msg.id} failed after all retries: {e}")

    async def run_forever(self):
        logger.info("Analysis worker started — polling for pending messages")
        while not self._shutdown.is_set():
            try:
                await self.process_pending_messages()
            except Exception as e:
                logger.error(f"Worker cycle failed: {e}")
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


analysis_worker = AnalysisWorker()

async def run_forever():
    await analysis_worker.run_forever()

async def shutdown_worker():
    await analysis_worker.shutdown()
