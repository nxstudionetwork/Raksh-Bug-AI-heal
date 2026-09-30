from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class ConnectedAppResponse(BaseModel):
    id: int
    user_id: int
    platform: str
    status: str
    permissions: dict = {}
    last_sync: Optional[datetime] = None
    monitoring_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConnectAppRequest(BaseModel):
    platform: str
    credentials: dict = {}


class UpdateAppRequest(BaseModel):
    status: Optional[str] = None
    permissions: Optional[dict] = None
    monitoring_enabled: Optional[bool] = None
