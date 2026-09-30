from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, RefreshTokenRequest,
    VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, TokenResponse,
)
from app.services.auth_service import AuthService
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User
from app.authentication.password import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        result = await service.register(req.name, req.email, req.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        result = await service.login(req.email, req.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh")
async def refresh(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        return await service.refresh_token(req.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/verify-email")
async def verify_email(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        await service.verify_email(token)
        return {"message": "Email verified successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.forgot_password(req.email)
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    try:
        await service.reset_password(req.token, req.password)
        return {"message": "Password reset successful"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(req.new_password)
    await db.flush()
    return {"message": "Password changed successfully"}
