from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.authentication.jwt import decode_token
from app.database.session import get_db
from app.repositories.user_repository import UserRepository

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = int(payload["sub"])
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status.value != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")

    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(required_role: str):
    async def role_checker(user=Depends(get_current_user)):
        if user.role.value != required_role and required_role == "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    return role_checker
