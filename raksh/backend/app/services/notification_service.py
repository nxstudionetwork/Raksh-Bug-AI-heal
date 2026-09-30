from typing import Dict, Optional, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification_repository import NotificationRepository
from app.database.models import NotificationType, Severity, NotificationStatus
from app.ai.explainable_ai.explainer import explainer
from app.utils.websocket_manager import ws_manager
from app.utils.logger import logger


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repo = NotificationRepository(db)

    async def create_scan_notification(self, user_id: int, scan_result: Dict, message_preview: str):
        severity = scan_result.get("severity", Severity.SAFE.value)
        category = scan_result.get("threat_category", "safe")
        risk_score = scan_result.get("risk_score", 0)
        notif_type = explainer.get_notification_type(severity)
        explanation = scan_result.get("explanation", "")
        recommendation = scan_result.get("recommendation", "")

        title = self._get_title(severity, category, risk_score)
        description = f"Risk Score: {risk_score}/100 — {explanation[:200]}"

        notif = await self.repo.create(
            user_id=user_id,
            type=notif_type,
            severity=severity,
            title=title,
            description=description,
            source=category,
            metadata={
                "risk_score": risk_score,
                "threat_category": category,
                "message_preview": message_preview[:100],
                "explanation": explanation[:200],
                "recommendation": recommendation[:200],
            },
        )

        await ws_manager.send_personal_message(user_id, "new_notification", {
            "id": notif.id,
            "type": notif_type,
            "severity": severity,
            "title": title,
            "description": description[:100],
            "timestamp": notif.created_at.isoformat() if notif.created_at else datetime.utcnow().isoformat(),
        })

        return notif

    def _get_title(self, severity: str, category: str, risk_score: float) -> str:
        titles = {
            Severity.CRITICAL.value: f"[CRITICAL] {category.replace('_', ' ').title()} Threat Detected",
            Severity.HIGH.value: f"[HIGH] High Risk {category.replace('_', ' ').title()} Alert",
            Severity.MEDIUM.value: f"[MEDIUM] Suspicious {category.replace('_', ' ').title()} Message",
            Severity.LOW.value: f"[LOW] Low Risk {category.replace('_', ' ').title()} Warning",
            Severity.SAFE.value: "[SAFE] Message Scanned - No Threats Found",
        }
        return titles.get(severity, f"[INFO] Message Analysis Complete")

    async def list_notifications(self, user_id: int, skip: int = 0, limit: int = 50, 
                                  notif_type: Optional[str] = None,
                                  search: Optional[str] = None):
        notifications = await self.repo.list_by_user(user_id, skip, limit, notif_type, search)
        total = await self.repo.count_by_user(user_id, notif_type, search)
        unread = await self.repo.count_unread(user_id)
        return {
            "total": total,
            "page": (skip // limit) + 1 if limit else 1,
            "page_size": limit,
            "unread_count": unread,
            "notifications": notifications,
        }

    async def mark_read(self, notification_id: int, user_id: int):
        result = await self.repo.mark_read(notification_id, user_id)
        unread = await self.repo.count_unread(user_id)
        await ws_manager.send_personal_message(user_id, "notification_read", {"id": notification_id, "unread_count": unread})
        return result

    async def mark_all_read(self, user_id: int):
        count = await self.repo.mark_all_read(user_id)
        await ws_manager.send_personal_message(user_id, "notifications_all_read", {"unread_count": 0})
        return {"marked_read": count}

    async def delete_notification(self, notification_id: int, user_id: int):
        return await self.repo.delete(notification_id, user_id)

    async def clear_all(self, user_id: int):
        count = await self.repo.clear_all(user_id)
        return {"deleted": count}
