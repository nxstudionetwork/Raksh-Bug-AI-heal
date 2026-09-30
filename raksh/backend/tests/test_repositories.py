import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.scan_repository import ScanRepository
from app.repositories.notification_repository import NotificationRepository


@pytest_asyncio.fixture
async def user(db_session: AsyncSession):
    repo = UserRepository(db_session)
    u = await repo.create(
        name="Test User",
        email="test@example.com",
        password_hash="hashed_pw",
    )
    yield u


class TestUserRepository:
    async def test_create_and_get(self, db_session: AsyncSession):
        repo = UserRepository(db_session)
        u = await repo.create(name="Alice", email="alice@test.com", password_hash="pw")
        assert u.id is not None

        found = await repo.get_by_email("alice@test.com")
        assert found is not None
        assert found.name == "Alice"

        by_id = await repo.get_by_id(u.id)
        assert by_id is not None


class TestMessageRepository:
    async def test_create_and_list(self, db_session: AsyncSession, user):
        repo = MessageRepository(db_session)
        msg = await repo.create(
            user_id=user.id, source="email",
            sender="attacker@phish.com", receiver=user.email,
            subject="Urgent!", message_content="Click here!",
        )
        assert msg.id is not None

        msgs = await repo.list_by_user(user.id, 0, 10)
        assert len(msgs) == 1
        assert msgs[0].sender == "attacker@phish.com"

    async def test_unprocessed(self, db_session: AsyncSession, user):
        repo = MessageRepository(db_session)
        await repo.create(
            user_id=user.id, source="sms",
            sender="+1234", receiver=user.email,
            message_content="Test",
        )
        unproc = await repo.get_unprocessed(limit=10)
        assert len(unproc) >= 1


class TestScanRepository:
    async def test_create_and_stats(self, db_session: AsyncSession, user):
        repo = ScanRepository(db_session)
        msg_repo = MessageRepository(db_session)

        msg = await msg_repo.create(
            user_id=user.id, source="email",
            sender="s", receiver="r",
            message_content="test",
        )

        scan = await repo.create(
            user_id=user.id, message_id=msg.id,
            risk_score=85, spam_score=10, scam_score=20,
            phishing_score=80, confidence=0.9,
            threat_category="phishing", severity="high",
            explanation="Phishing detected", recommendation="Delete immediately",
            processing_time_ms=50, model_version="1.0.0",
        )
        assert scan.id is not None

        stats = await repo.get_stats(user.id)
        assert stats["total_scans"] >= 1
        assert stats["high_count"] >= 1


class TestNotificationRepository:
    async def test_create_and_mark_read(self, db_session: AsyncSession, user):
        repo = NotificationRepository(db_session)
        notif = await repo.create(
            user_id=user.id, type="danger", severity="high",
            title="Threat detected", description="Phishing found",
        )
        assert notif.id is not None

        unread = await repo.count_unread(user.id)
        assert unread >= 1

        await repo.mark_read(notif.id, user_id=user.id)
        await db_session.refresh(notif)
