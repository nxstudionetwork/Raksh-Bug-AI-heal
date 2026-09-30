from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database.session import get_db
from app.schemas.message import MessageCreate, MessageResponse, MessageListResponse
from app.repositories.message_repository import MessageRepository
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User

router = APIRouter(prefix="/api/messages", tags=["Messages"])


@router.post("/", response_model=MessageResponse)
async def create_message(
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = MessageRepository(db)
    msg = await repo.create(
        user_id=current_user.id,
        source=req.source,
        sender=req.sender,
        receiver=req.receiver,
        subject=req.subject,
        message_content=req.message_content,
        attachments=req.attachments,
        urls=req.urls,
    )
    return msg


@router.get("/", response_model=MessageListResponse)
async def list_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    source: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = MessageRepository(db)
    messages = await repo.list_by_user(current_user.id, skip, limit, source)
    total = await repo.count_by_user(current_user.id, source)
    return {
        "total": total,
        "page": (skip // limit) + 1,
        "page_size": limit,
        "messages": messages,
    }


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = MessageRepository(db)
    msg = await repo.get_by_id(message_id)
    if not msg or msg.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg
