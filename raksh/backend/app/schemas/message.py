from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class MessageCreate(BaseModel):
    source: str
    sender: str
    receiver: str
    subject: Optional[str] = None
    message_content: str
    attachments: list = []
    urls: list = []


class MessageResponse(BaseModel):
    id: int
    user_id: int
    source: str
    sender: str
    receiver: str
    subject: Optional[str] = None
    message_content: str
    attachments: list = []
    urls: list = []
    received_time: datetime
    processed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    messages: List[MessageResponse]
