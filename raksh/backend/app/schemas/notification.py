from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    severity: str
    title: str
    description: Optional[str] = None
    status: str
    source: Optional[str] = None
    metadata: dict = {}
    created_at: datetime
    read_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    unread_count: int
    notifications: List[NotificationResponse]


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[int]] = None
