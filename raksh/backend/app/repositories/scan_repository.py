from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, and_, case, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from app.database.models import ScanResult, Message, ThreatCategory


class ScanRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, message_id: int, **kwargs) -> ScanResult:
        scan = ScanResult(user_id=user_id, message_id=message_id, **kwargs)
        self.db.add(scan)
        await self.db.flush()
        return scan

    async def get_by_id(self, scan_id: int) -> Optional[ScanResult]:
        result = await self.db.execute(
            select(ScanResult).where(ScanResult.id == scan_id)
            .options(selectinload(ScanResult.message))
        )
        return result.scalar_one_or_none()

    async def get_by_message_id(self, message_id: int) -> Optional[ScanResult]:
        result = await self.db.execute(
            select(ScanResult).where(ScanResult.message_id == message_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int, skip: int = 0, limit: int = 50,
                           severity: Optional[str] = None,
                           category: Optional[str] = None,
                           search: Optional[str] = None,
                           source: Optional[str] = None,
                           sort: Optional[str] = "newest") -> List[ScanResult]:
        query = select(ScanResult).where(ScanResult.user_id == user_id)
        
        if severity and severity != "all":
            query = query.where(ScanResult.severity == severity)
        if category and category != "all":
            category_val = category.lower().replace(" ", "_")
            query = query.where(ScanResult.threat_category == category_val)
        if search:
            query = query.join(Message).where(
                Message.message_content.ilike(f"%{search}%")
            )
        if source and source != "all":
            query = query.join(Message).where(Message.source == source)
        
        if sort == "oldest":
            query = query.order_by(ScanResult.created_at.asc())
        elif sort == "risk-desc":
            query = query.order_by(ScanResult.risk_score.desc())
        elif sort == "risk-asc":
            query = query.order_by(ScanResult.risk_score.asc())
        else:
            query = query.order_by(ScanResult.created_at.desc())
        
        query = query.offset(skip).limit(limit).options(selectinload(ScanResult.message))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_by_user(self, user_id: int, severity: Optional[str] = None,
                            category: Optional[str] = None,
                            search: Optional[str] = None,
                            source: Optional[str] = None) -> int:
        query = select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id)
        if severity and severity != "all":
            query = query.where(ScanResult.severity == severity)
        if category and category != "all":
            category_val = category.lower().replace(" ", "_")
            query = query.where(ScanResult.threat_category == category_val)
        if search:
            query = query.join(Message).where(Message.message_content.ilike(f"%{search}%"))
        if source and source != "all":
            query = query.join(Message).where(Message.source == source)
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_stats(self, user_id: int) -> Dict:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        total_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id)
        )
        total = total_q.scalar() or 0
        
        safe_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(
                ScanResult.user_id == user_id, ScanResult.severity == "safe"
            )
        )
        safe = safe_q.scalar() or 0
        
        low_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(
                ScanResult.user_id == user_id, ScanResult.severity == "low"
            )
        )
        low = low_q.scalar() or 0
        
        medium_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(
                ScanResult.user_id == user_id, ScanResult.severity == "medium"
            )
        )
        medium = medium_q.scalar() or 0
        
        high_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(
                ScanResult.user_id == user_id, ScanResult.severity == "high"
            )
        )
        high = high_q.scalar() or 0
        
        critical_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(
                ScanResult.user_id == user_id, ScanResult.severity == "critical"
            )
        )
        critical = critical_q.scalar() or 0
        
        today_q = await self.db.execute(
            select(func.count(ScanResult.id)).where(
                ScanResult.user_id == user_id,
                ScanResult.created_at >= today_start
            )
        )
        today_count = today_q.scalar() or 0
        
        avg_q = await self.db.execute(
            select(func.avg(ScanResult.risk_score)).where(ScanResult.user_id == user_id)
        )
        avg_risk = round(avg_q.scalar() or 0, 1)
        
        threat_counts_q = await self.db.execute(
            select(ScanResult.threat_category, func.count(ScanResult.id))
            .where(
                ScanResult.user_id == user_id,
                ScanResult.threat_category != ThreatCategory.SAFE
            )
            .group_by(ScanResult.threat_category)
            .order_by(func.count(ScanResult.id).desc())
            .limit(5)
        )
        top_threats = [
            {"category": row[0].value if hasattr(row[0], 'value') else str(row[0]), "count": row[1]}
            for row in threat_counts_q.all()
        ]
        
        return {
            "total_scans": total, "safe_count": safe, "low_count": low,
            "medium_count": medium, "high_count": high, "critical_count": critical,
            "scans_today": today_count, "avg_risk_score": avg_risk,
            "top_threats": top_threats,
        }

    async def get_trends(self, user_id: int, days: int = 30) -> Dict:
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        start = now - timedelta(days=days)

        daily_raw = await self.db.execute(
            select(
                func.date(ScanResult.created_at).label("day"),
                func.count(ScanResult.id).label("count"),
            )
            .where(ScanResult.user_id == user_id, ScanResult.created_at >= start)
            .group_by(func.date(ScanResult.created_at))
            .order_by(func.date(ScanResult.created_at))
        )
        daily_map = {str(row.day): row.count for row in daily_raw.all()}

        daily_scans = []
        for i in range(days):
            d = now - timedelta(days=days - 1 - i)
            key = d.strftime("%Y-%m-%d")
            label = d.strftime("%b %d")
            daily_scans.append({"date": key, "label": label, "count": daily_map.get(key, 0)})

        category_raw = await self.db.execute(
            select(ScanResult.threat_category, func.count(ScanResult.id))
            .where(ScanResult.user_id == user_id)
            .group_by(ScanResult.threat_category)
            .order_by(func.count(ScanResult.id).desc())
        )
        category_breakdown = [
            {"category": row[0].value if hasattr(row[0], 'value') else str(row[0]), "count": row[1]}
            for row in category_raw.all()
        ]

        return {
            "daily_scans": daily_scans,
            "category_breakdown": category_breakdown,
            "risk_distribution": {
                "safe": (await self.db.execute(select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id, ScanResult.severity == "safe"))).scalar() or 0,
                "low": (await self.db.execute(select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id, ScanResult.severity == "low"))).scalar() or 0,
                "medium": (await self.db.execute(select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id, ScanResult.severity == "medium"))).scalar() or 0,
                "high": (await self.db.execute(select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id, ScanResult.severity == "high"))).scalar() or 0,
                "critical": (await self.db.execute(select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id, ScanResult.severity == "critical"))).scalar() or 0,
            },
            "total_scans": (await self.db.execute(select(func.count(ScanResult.id)).where(ScanResult.user_id == user_id))).scalar() or 0,
        }

    async def delete(self, scan_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            select(ScanResult).where(ScanResult.id == scan_id, ScanResult.user_id == user_id)
        )
        scan = result.scalar_one_or_none()
        if scan:
            await self.db.delete(scan)
            await self.db.flush()
            return True
        return False
