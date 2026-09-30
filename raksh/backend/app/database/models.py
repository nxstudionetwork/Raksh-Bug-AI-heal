import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Enum, JSON, Index, UniqueConstraint, BigInteger
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum


class Base(DeclarativeBase):
    pass


# ---------- Enums ----------

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class ThreatCategory(str, enum.Enum):
    SPAM = "spam"
    SCAM = "scam"
    PHISHING = "phishing"
    BANKING_FRAUD = "banking_fraud"
    OTP_FRAUD = "otp_fraud"
    FAKE_JOB = "fake_job"
    CRYPTO_SCAM = "crypto_scam"
    SOCIAL_ENGINEERING = "social_engineering"
    FAKE_DELIVERY = "fake_delivery"
    SAFE = "safe"


class Severity(str, enum.Enum):
    SAFE = "safe"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationType(str, enum.Enum):
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"
    INFO = "info"
    SYSTEM = "system"


class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    DISMISSED = "dismissed"


class AppPlatform(str, enum.Enum):
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
    TELEGRAM = "telegram"
    MESSENGER = "messenger"
    GMAIL = "gmail"
    OUTLOOK = "outlook"
    SLACK = "slack"
    TEAMS = "teams"
    DISCORD = "discord"
    BROWSER_EXTENSION = "browser_extension"
    MANUAL = "manual"
    SMS_GATEWAY = "sms_gateway"


# ---------- User ----------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.ACTIVE)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_password_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_password_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    organization_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="users")
    connected_apps = relationship("ConnectedApp", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    scan_results = relationship("ScanResult", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


# ---------- Organization ----------

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    plan: Mapped[str] = mapped_column(String(50), default="free")
    max_users: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="organization")


# ---------- User Session ----------

class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    refresh_token: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")


# ---------- Connected App ----------

class ConnectedApp(Base):
    __tablename__ = "connected_apps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform: Mapped[AppPlatform] = mapped_column(Enum(AppPlatform), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="connected")
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    account_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    permissions: Mapped[dict] = mapped_column(JSON, default=dict)
    webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_sync: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_health_check: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    monitoring_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="connected_apps")

    __table_args__ = (
        UniqueConstraint("user_id", "platform", name="uq_user_platform"),
    )


# ---------- Message ----------

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    connected_app_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("connected_apps.id", ondelete="SET NULL"), nullable=True)
    source: Mapped[AppPlatform] = mapped_column(Enum(AppPlatform), nullable=False)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    receiver: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    message_content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[list] = mapped_column(JSON, default=list)
    urls: Mapped[list] = mapped_column(JSON, default=list)
    received_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="messages")
    connected_app = relationship("ConnectedApp")
    scan_result = relationship("ScanResult", back_populates="message", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_messages_user_received", "user_id", "received_time"),
        Index("idx_messages_source", "source"),
    )


# ---------- Scan Result ----------

class ScanResult(Base):
    __tablename__ = "scan_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    spam_score: Mapped[float] = mapped_column(Float, default=0.0)
    scam_score: Mapped[float] = mapped_column(Float, default=0.0)
    phishing_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    threat_category: Mapped[ThreatCategory] = mapped_column(Enum(ThreatCategory), default=ThreatCategory.SAFE)
    severity: Mapped[Severity] = mapped_column(Enum(Severity), default=Severity.SAFE)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_actions: Mapped[list] = mapped_column(JSON, default=list)
    detected_keywords: Mapped[list] = mapped_column(JSON, default=list)
    psychological_tactics: Mapped[dict] = mapped_column(JSON, default=dict)
    threat_intel_matches: Mapped[list] = mapped_column(JSON, default=list)
    url_analyses: Mapped[list] = mapped_column(JSON, default=list)
    processing_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0")
    user_feedback: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="scan_results")
    message = relationship("Message", back_populates="scan_result")


# ---------- Notification ----------

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), nullable=False)
    severity: Mapped[Severity] = mapped_column(Enum(Severity), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[NotificationStatus] = mapped_column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="notifications")

    __table_args__ = (
        Index("idx_notifications_user_status", "user_id", "status"),
    )


# ---------- Activity Log ----------

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resource_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activity_logs")

    __table_args__ = (
        Index("idx_activity_user_created", "user_id", "created_at"),
    )


# ---------- File Storage ----------

class FileStorage(Base):
    __tablename__ = "file_storage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, default=0)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_type: Mapped[str] = mapped_column(String(50), default="other")
    is_scan_result: Mapped[bool] = mapped_column(Boolean, default=False)
    scan_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("scan_results.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


# ---------- Threat Intelligence ----------

class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    indicator: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    indicator_type: Mapped[str] = mapped_column(String(50), nullable=False)
    threat_category: Mapped[ThreatCategory] = mapped_column(Enum(ThreatCategory), nullable=False)
    severity: Mapped[Severity] = mapped_column(Enum(Severity), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    hit_count: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_threat_type_severity", "indicator_type", "severity"),
    )


# ---------- AI Training Data ----------

class AITrainingData(Base):
    __tablename__ = "ai_training_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    scan_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("scan_results.id", ondelete="SET NULL"), nullable=True)
    message_content: Mapped[str] = mapped_column(Text, nullable=False)
    ai_prediction: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    user_feedback: Mapped[str | None] = mapped_column(String(50), nullable=True)
    verified_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    correction: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------- Report ----------

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), default="weekly")
    date_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    date_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    summary: Mapped[dict] = mapped_column(JSON, default=dict)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(50), default="generated")
    file_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("file_storage.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


# ---------- User Settings ----------

class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    theme: Mapped[str] = mapped_column(String(20), default="dark")
    accent_color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    animations_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    privacy_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_scan: Mapped[bool] = mapped_column(Boolean, default=True)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    desktop_notifications: Mapped[bool] = mapped_column(Boolean, default=False)
    alert_level: Mapped[str] = mapped_column(String(20), default="all")
    ai_detection_level: Mapped[str] = mapped_column(String(20), default="balanced")
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False)
    font_size: Mapped[str] = mapped_column(String(20), default="normal")
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
