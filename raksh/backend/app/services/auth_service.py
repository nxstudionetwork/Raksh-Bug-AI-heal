from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.repositories.settings_repository import SettingsRepository
from app.authentication.password import hash_password, verify_password
from app.authentication.jwt import (
    create_access_token, create_refresh_token, decode_token,
    generate_email_verification_token, generate_password_reset_token
)
from app.services.email_service import send_verification_email, send_password_reset_email, send_welcome_email
from app.database.models import Notification, NotificationType, Severity, NotificationStatus, ActivityLog
from app.utils.logger import logger


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.settings_repo = SettingsRepository(db)
        self.db = db

    async def register(self, name: str, email: str, password: str) -> dict:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        hashed = hash_password(password)
        verify_token = generate_email_verification_token()

        user = await self.user_repo.create(
            name=name,
            email=email,
            password_hash=hashed,
            email_verification_token=verify_token,
        )

        await self.settings_repo.upsert(user.id, {})

        welcome_notif = Notification(
            user_id=user.id,
            type=NotificationType.INFO,
            severity=Severity.SAFE,
            title="Welcome to RAKSH",
            description=f"Welcome {name}! Your account has been created. Start securing your digital life with AI-powered threat detection.",
            status=NotificationStatus.UNREAD,
            source="system",
        )
        self.db.add(welcome_notif)

        activity = ActivityLog(
            user_id=user.id,
            action="register",
            resource="user",
            resource_id=user.id,
            details={"email": email},
        )
        self.db.add(activity)

        await self.db.flush()

        send_verification_email(email, verify_token)

        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        logger.info(f"User registered: {email} (id={user.id})")
        return {
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value},
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError("Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        if user.status.value != "active":
            raise ValueError("Account is inactive or suspended")

        user.last_login = datetime.now(timezone.utc)
        await self.user_repo.update(user)

        await self.settings_repo.upsert(user.id, {})

        activity = ActivityLog(
            user_id=user.id,
            action="login",
            resource="session",
            resource_id=user.id,
            details={"email": email},
        )
        self.db.add(activity)
        await self.db.flush()

        access_token = create_access_token(user.id, user.role.value)
        refresh_token = create_refresh_token(user.id)

        logger.info(f"User logged in: {email}")
        return {
            "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value},
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user_id = int(payload["sub"])
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.status.value != "active":
            raise ValueError("User not found or inactive")

        access_token = create_access_token(user.id, user.role.value)
        new_refresh_token = create_refresh_token(user.id)

        return {"access_token": access_token, "refresh_token": new_refresh_token}

    async def verify_email(self, token: str) -> bool:
        user = await self.user_repo.get_by_verification_token(token)
        if not user:
            raise ValueError("Invalid verification token")

        user.email_verified = True
        user.email_verification_token = None
        await self.user_repo.update(user)

        send_welcome_email(user.email, user.name)
        logger.info(f"Email verified: {user.email}")
        return True

    async def forgot_password(self, email: str) -> bool:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return True  # Don't reveal if email exists

        reset_token = generate_password_reset_token()
        user.reset_password_token = reset_token
        user.reset_password_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.user_repo.update(user)

        send_password_reset_email(email, reset_token)
        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        user = await self.user_repo.get_by_reset_token(token)
        if not user:
            raise ValueError("Invalid reset token")
        if not user.reset_password_expires or user.reset_password_expires < datetime.now(timezone.utc):
            raise ValueError("Reset token has expired")

        user.password_hash = hash_password(new_password)
        user.reset_password_token = None
        user.reset_password_expires = None
        await self.user_repo.update(user)

        logger.info(f"Password reset: {user.email}")
        return True
