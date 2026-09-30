from typing import Optional, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.scan_repository import ScanRepository
from app.repositories.message_repository import MessageRepository
from app.ai.pipeline import pipeline
from app.services.notification_service import NotificationService
from app.utils.websocket_manager import ws_manager
from app.utils.logger import logger


class ScanService:
    def __init__(self, db: AsyncSession):
        self.scan_repo = ScanRepository(db)
        self.msg_repo = MessageRepository(db)
        self.notif_service = NotificationService(db)

    async def scan_message(self, user_id: int, source: str, sender: str,
                           receiver: str, message_content: str,
                           subject: Optional[str] = None, connected_app_id: Optional[int] = None,
                           attachments: list = None, urls: list = None):
        msg = await self.msg_repo.create(
            user_id=user_id,
            source=source,
            sender=sender,
            receiver=receiver,
            subject=subject,
            message_content=message_content,
            connected_app_id=connected_app_id,
        )

        result = await pipeline.analyze(message_content, subject or "", source)

        scan = await self.scan_repo.create(
            user_id=user_id,
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

        await self.msg_repo.mark_processed(msg)

        notif = await self.notif_service.create_scan_notification(
            user_id=user_id,
            scan_result=result,
            message_preview=message_content[:100],
        )

        # Attach message to scan for serialization without lazy loading
        scan.message = msg

        await ws_manager.send_personal_message(user_id, "scan_complete", {
            "scan_id": scan.id,
            "risk_score": result["risk_score"],
            "severity": result["severity"],
            "threat_category": result["threat_category"],
            "explanation": result["explanation"],
        })

        return scan

    async def get_scan_history(self, user_id: int, skip: int = 0, limit: int = 50,
                                severity: Optional[str] = None,
                                category: Optional[str] = None,
                                search: Optional[str] = None,
                                source: Optional[str] = None,
                                sort: Optional[str] = "newest"):
        scans = await self.scan_repo.list_by_user(
            user_id, skip, limit, severity, category, search, source, sort
        )
        total = await self.scan_repo.count_by_user(user_id, severity, category, search, source)
        return {
            "total": total,
            "page": (skip // limit) + 1 if limit else 1,
            "page_size": limit,
            "scans": scans,
        }

    async def get_scan_stats(self, user_id: int):
        return await self.scan_repo.get_stats(user_id)

    async def delete_scan(self, scan_id: int, user_id: int):
        return await self.scan_repo.delete(scan_id, user_id)
