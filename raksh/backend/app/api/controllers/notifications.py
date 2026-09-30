from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database.session import get_db
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.notification_service import NotificationService
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _serialize_notif(n):
    return {
        "id": n.id,
        "user_id": n.user_id,
        "type": n.type.value if hasattr(n.type, 'value') else n.type,
        "severity": n.severity.value if hasattr(n.severity, 'value') else n.severity,
        "title": n.title,
        "description": n.description,
        "status": n.status.value if hasattr(n.status, 'value') else n.status,
        "source": n.source,
        "metadata": getattr(n, 'metadata_json', {}),
        "created_at": n.created_at,
        "read_at": n.read_at,
    }


@router.get("/")
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    notif_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    result = await service.list_notifications(
        current_user.id, skip, limit, notif_type
    )
    result["notifications"] = [_serialize_notif(n) for n in result["notifications"]]
    return result


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    count = await service.repo.count_unread(current_user.id)
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    result = await service.mark_read(notification_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return _serialize_notif(result)


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.mark_all_read(current_user.id)


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    success = await service.delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}


@router.delete("/")
async def clear_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.clear_all(current_user.id)
