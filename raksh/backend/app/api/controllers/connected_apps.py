from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.session import get_db
from app.schemas.connected_app import ConnectedAppResponse, ConnectAppRequest, UpdateAppRequest
from app.repositories.connected_app_repository import ConnectedAppRepository
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User

router = APIRouter(prefix="/api/connected-apps", tags=["Connected Apps"])


@router.get("/", response_model=List[ConnectedAppResponse])
async def list_apps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ConnectedAppRepository(db)
    return await repo.list_by_user(current_user.id)


@router.post("/", response_model=ConnectedAppResponse)
async def connect_app(
    req: ConnectAppRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ConnectedAppRepository(db)
    existing = await repo.get_by_user_and_platform(current_user.id, req.platform)
    if existing:
        raise HTTPException(status_code=400, detail="App already connected")

    return await repo.create(
        user_id=current_user.id,
        platform=req.platform,
        account_email=req.credentials.get("email") if isinstance(req.credentials, dict) else None,
    )


@router.put("/{app_id}", response_model=ConnectedAppResponse)
async def update_app(
    app_id: int,
    req: UpdateAppRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ConnectedAppRepository(db)
    app = await repo.get_by_id(app_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="App not found")

    if req.status is not None:
        app.status = req.status
    if req.permissions is not None:
        app.permissions = req.permissions
    if req.monitoring_enabled is not None:
        app.monitoring_enabled = req.monitoring_enabled

    return await repo.update_app(app)


@router.delete("/{app_id}")
async def disconnect_app(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ConnectedAppRepository(db)
    app = await repo.get_by_id(app_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="App not found")

    await repo.delete_app(app)
    return {"message": "App disconnected"}
