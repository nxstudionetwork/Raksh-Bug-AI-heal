from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.scan_repository import ScanRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.connected_app_repository import ConnectedAppRepository
from app.repositories.message_repository import MessageRepository
from app.utils.logger import logger


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.scan_repo = ScanRepository(db)
        self.notif_repo = NotificationRepository(db)
        self.app_repo = ConnectedAppRepository(db)
        self.msg_repo = MessageRepository(db)

    async def get_stats(self, user_id: int) -> dict:
        scan_stats = await self.scan_repo.get_stats(user_id)
        unread_count = await self.notif_repo.count_unread(user_id)
        apps = await self.app_repo.list_by_user(user_id)
        today = datetime.now(timezone.utc).date()
        
        health_score = self._compute_health_score(scan_stats)
        
        today_scans_count = scan_stats.get("scans_today", 0)
        today_threats = (scan_stats.get("critical_count", 0) + 
                        scan_stats.get("high_count", 0))
        
        return {
            "total_scans": scan_stats["total_scans"],
            "threats_detected": scan_stats["high_count"] + scan_stats["critical_count"],
            "safe_messages": scan_stats["safe_count"],
            "active_threats": scan_stats["critical_count"],
            "health_score": health_score,
            "scans_today": today_scans_count,
            "critical_alerts": scan_stats["critical_count"],
            "unread_notifications": unread_count,
            "connected_apps": len(apps),
            "top_threats": scan_stats.get("top_threats", []),
            "avg_risk_score": scan_stats.get("avg_risk_score", 0),
            "messages_scanned": scan_stats["total_scans"],
            "today_threats": today_threats,
            "today_activity": f"{today_scans_count} scans today · {today_threats} threats blocked · {scan_stats.get('safe_count', 0)} safe messages",
        }

    async def get_trends(self, user_id: int, days: int = 30) -> dict:
        return await self.scan_repo.get_trends(user_id, days)

    def _compute_health_score(self, stats: dict) -> int:
        total = stats["total_scans"]
        if total == 0:
            return 87
        threat_ratio = (stats["critical_count"] + stats["high_count"]) / max(total, 1)
        safe_ratio = stats["safe_count"] / max(total, 1)
        score = int((safe_ratio * 60 + (1 - threat_ratio) * 40) * 100)
        return max(0, min(100, score))
