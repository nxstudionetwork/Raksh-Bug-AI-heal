from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import instance_state
from typing import Optional
from app.database.session import get_db
from app.schemas.message import MessageCreate
from app.schemas.scan import ScanResultResponse, ScanHistoryResponse, ScanStatsResponse
from app.services.scan_service import ScanService
from app.repositories.scan_repository import ScanRepository
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User
from datetime import datetime


router = APIRouter(prefix="/api/scans", tags=["Scans"])


def _get_enum_value(val):
    return val.value if hasattr(val, 'value') else val


def _serialize_scan(scan):
    msg_data = None
    try:
        m = scan.message
        if m is not None:
            msg_data = {
                "id": m.id,
                "source": m.source,
                "sender": m.sender,
                "receiver": m.receiver,
                "subject": m.subject,
                "message_content": m.message_content,
            }
    except Exception:
        msg_data = None
    return {
        "id": scan.id,
        "user_id": scan.user_id,
        "message_id": scan.message_id,
        "message": msg_data,
        "risk_score": scan.risk_score,
        "spam_score": scan.spam_score,
        "scam_score": scan.scam_score,
        "phishing_score": scan.phishing_score,
        "confidence": scan.confidence,
        "threat_category": _get_enum_value(scan.threat_category),
        "severity": _get_enum_value(scan.severity),
        "explanation": scan.explanation,
        "recommendation": scan.recommendation,
        "suggested_actions": scan.suggested_actions,
        "detected_keywords": scan.detected_keywords,
        "psychological_tactics": scan.psychological_tactics,
        "threat_intel_matches": scan.threat_intel_matches,
        "url_analyses": scan.url_analyses,
        "processing_time_ms": scan.processing_time_ms,
        "model_version": scan.model_version,
        "created_at": scan.created_at.isoformat() if isinstance(scan.created_at, datetime) else str(scan.created_at),
    }

@router.post("/analyze")
async def analyze_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ScanService(db)
    scan = await service.scan_message(
        user_id=current_user.id,
        source=message.source,
        sender=message.sender,
        receiver=message.receiver,
        message_content=message.message_content,
        subject=message.subject,
    )
    return _serialize_scan(scan)


@router.get("/")
async def get_scan_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    severity: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    sort: Optional[str] = "newest",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ScanService(db)
    result = await service.get_scan_history(
        current_user.id, skip, limit, severity, category, search, source, sort
    )
    result["scans"] = [_serialize_scan(s) for s in result["scans"]]
    return result


@router.get("/stats")
async def get_scan_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ScanService(db)
    stats = await service.get_scan_stats(current_user.id)
    return stats


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ScanService(db)
    deleted = await service.delete_scan(scan_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"success": True, "message": "Scan deleted"}


@router.get("/{scan_id}")
async def get_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ScanRepository(db)
    scan = await repo.get_by_id(scan_id)
    if not scan or scan.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Scan not found")
    return _serialize_scan(scan)
