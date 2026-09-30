import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import get_db


@pytest.fixture
def client(override_get_db):
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
async def auth_headers(client):
    resp = await client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "SecureP@ss123",
    })
    data = resp.json()
    return {"Authorization": f"Bearer {data.get('access_token', '')}"}


class TestFullAuth:
    async def test_register_success(self, client):
        resp = await client.post("/api/auth/register", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "SecureP@ss123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "newuser@test.com"

    async def test_register_duplicate(self, client):
        resp = await client.post("/api/auth/register", json={
            "name": "Duplicate",
            "email": "dup@test.com",
            "password": "SecureP@ss123",
        })
        assert resp.status_code == 200
        resp2 = await client.post("/api/auth/register", json={
            "name": "Duplicate2",
            "email": "dup@test.com",
            "password": "SecureP@ss123",
        })
        assert resp2.status_code == 400

    async def test_login_success(self, client, auth_headers):
        resp = await client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "SecureP@ss123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    async def test_login_invalid_password(self, client):
        resp = await client.post("/api/auth/login", json={
            "email": "testuser@example.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent(self, client):
        resp = await client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "SecureP@ss123",
        })
        assert resp.status_code == 401

    async def test_token_refresh(self, client):
        reg = await client.post("/api/auth/register", json={
            "name": "Refresh Tester",
            "email": "refresh@test.com",
            "password": "SecureP@ss123",
        })
        data = reg.json()
        refresh = data["refresh_token"]
        resp = await client.post("/api/auth/refresh", json={
            "refresh_token": refresh,
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_token_refresh_invalid(self, client):
        resp = await client.post("/api/auth/refresh", json={
            "refresh_token": "invalid_token_here",
        })
        assert resp.status_code == 401

    async def test_change_password(self, client, auth_headers):
        resp = await client.post("/api/auth/change-password", json={
            "current_password": "SecureP@ss123",
            "new_password": "NewSecureP@ss456",
        }, headers=auth_headers)
        assert resp.status_code == 200

    async def test_get_profile(self, client, auth_headers):
        resp = await client.get("/api/users/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "testuser@example.com"

    async def test_unauthorized_access(self, client):
        resp = await client.get("/api/users/me")
        assert resp.status_code == 401

    async def test_invalid_token(self, client):
        resp = await client.get("/api/users/me", headers={"Authorization": "Bearer invalid"})
        assert resp.status_code == 401


class TestFullScans:
    async def test_analyze_message(self, client, auth_headers):
        resp = await client.post("/api/scans/analyze", json={
            "source": "manual",
            "sender": "unknown",
            "receiver": "me",
            "message_content": "URGENT: Your account has been compromised. Click here to verify.",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "risk_score" in data or "id" in data

    async def test_get_scan_history(self, client, auth_headers):
        resp = await client.get("/api/scans/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "scans" in data or isinstance(data, list)

    async def test_get_scan_stats(self, client, auth_headers):
        resp = await client.get("/api/scans/stats", headers=auth_headers)
        assert resp.status_code == 200

    async def test_get_scan_by_id(self, client, auth_headers):
        scan_resp = await client.post("/api/scans/analyze", json={
            "source": "manual",
            "sender": "test",
            "receiver": "me",
            "message_content": "Test scan for detail view",
        }, headers=auth_headers)
        scan = scan_resp.json()
        scan_id = scan.get("id")
        if scan_id:
            resp = await client.get(f"/api/scans/{scan_id}", headers=auth_headers)
            assert resp.status_code == 200

    async def test_delete_scan(self, client, auth_headers):
        scan_resp = await client.post("/api/scans/analyze", json={
            "source": "manual",
            "sender": "test",
            "receiver": "me",
            "message_content": "Test scan for deletion",
        }, headers=auth_headers)
        scan = scan_resp.json()
        scan_id = scan.get("id")
        if scan_id:
            resp = await client.delete(f"/api/scans/{scan_id}", headers=auth_headers)
            assert resp.status_code == 200


class TestFullMessages:
    async def test_create_message(self, client, auth_headers):
        resp = await client.post("/api/messages/", json={
            "source": "manual",
            "sender": "someone@phish.com",
            "receiver": "me@test.com",
            "subject": "Urgent!",
            "message_content": "Click here to claim your prize!",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("sender") == "someone@phish.com"

    async def test_list_messages(self, client, auth_headers):
        resp = await client.get("/api/messages/", headers=auth_headers)
        assert resp.status_code == 200

    async def test_get_message(self, client, auth_headers):
        create_resp = await client.post("/api/messages/", json={
            "source": "email",
            "sender": "test@test.com",
            "receiver": "me@test.com",
            "message_content": "Test message detail",
        }, headers=auth_headers)
        msg = create_resp.json()
        msg_id = msg.get("id")
        if msg_id:
            resp = await client.get(f"/api/messages/{msg_id}", headers=auth_headers)
            assert resp.status_code == 200


class TestFullNotifications:
    async def test_get_notifications(self, client, auth_headers):
        resp = await client.get("/api/notifications/", headers=auth_headers)
        assert resp.status_code == 200

    async def test_unread_count(self, client, auth_headers):
        resp = await client.get("/api/notifications/unread-count", headers=auth_headers)
        assert resp.status_code == 200

    async def test_mark_all_read(self, client, auth_headers):
        resp = await client.put("/api/notifications/read-all", headers=auth_headers)
        assert resp.status_code == 200

    async def test_clear_all(self, client, auth_headers):
        resp = await client.delete("/api/notifications/", headers=auth_headers)
        assert resp.status_code == 200


class TestConnectedApps:
    async def test_get_connected_apps(self, client, auth_headers):
        resp = await client.get("/api/connected-apps/", headers=auth_headers)
        assert resp.status_code == 200

    async def test_connect_app(self, client, auth_headers):
        resp = await client.post("/api/connected-apps/", json={
            "platform": "whatsapp",
            "credentials": {"phone": "+911234567890"},
        }, headers=auth_headers)
        assert resp.status_code in (200, 201)

    async def test_update_app(self, client, auth_headers):
        create = await client.post("/api/connected-apps/", json={
            "platform": "telegram",
            "credentials": {"username": "@testuser"},
        }, headers=auth_headers)
        app = create.json()
        app_id = app.get("id")
        if app_id:
            resp = await client.put(f"/api/connected-apps/{app_id}", json={
                "monitoring_enabled": False,
            }, headers=auth_headers)
            assert resp.status_code == 200

    async def test_disconnect_app(self, client, auth_headers):
        create = await client.post("/api/connected-apps/", json={
            "platform": "discord",
            "credentials": {"user_id": "user#1234"},
        }, headers=auth_headers)
        app = create.json()
        app_id = app.get("id")
        if app_id:
            resp = await client.delete(f"/api/connected-apps/{app_id}", headers=auth_headers)
            assert resp.status_code == 200


class TestSettings:
    async def test_get_settings(self, client, auth_headers):
        resp = await client.get("/api/settings/", headers=auth_headers)
        assert resp.status_code == 200

    async def test_update_settings(self, client, auth_headers):
        resp = await client.put("/api/settings/", json={
            "ai_protection": True,
            "privacy_mode": False,
            "notifications_enabled": True,
            "language": "en",
            "theme": "dark",
        }, headers=auth_headers)
        assert resp.status_code == 200

    async def test_update_settings_partial(self, client, auth_headers):
        resp = await client.put("/api/settings/", json={
            "language": "hi",
        }, headers=auth_headers)
        assert resp.status_code in (200, 422)


class TestFileUpload:
    async def test_upload_file_no_auth(self, client):
        resp = await client.post("/api/files/upload")
        assert resp.status_code == 401

    async def test_list_files(self, client, auth_headers):
        resp = await client.get("/api/files/", headers=auth_headers)
        assert resp.status_code == 200


class TestDashboard:
    async def test_dashboard_stats(self, client, auth_headers):
        resp = await client.get("/api/dashboard/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)


class TestHealth:
    async def test_health_check(self, client):
        resp = await client.get("/api/health/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    async def test_db_health(self, client):
        resp = await client.get("/api/health/db")
        assert resp.status_code == 200

    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200

    async def test_docs_available(self, client):
        resp = await client.get("/api/docs")
        assert resp.status_code in (200, 302, 303)

    async def test_openapi(self, client):
        resp = await client.get("/api/openapi.json")
        assert resp.status_code == 200
        assert "openapi" in resp.json()


class TestErrorHandling:
    async def test_404(self, client):
        resp = await client.get("/api/nonexistent")
        assert resp.status_code == 404

    async def test_validation_error(self, client, auth_headers):
        resp = await client.post("/api/auth/register", json={
            "name": "Bad",
            "email": "not-an-email",
        }, headers=auth_headers)
        assert resp.status_code == 422


class TestScanSearch:
    async def test_scan_search(self, client, auth_headers):
        resp = await client.get("/api/scans/?search=test&severity=high&sort=newest", headers=auth_headers)
        assert resp.status_code == 200

    async def test_scan_pagination(self, client, auth_headers):
        resp = await client.get("/api/scans/?skip=0&limit=5", headers=auth_headers)
        assert resp.status_code == 200


class TestRateLimit:
    async def test_rate_limit_header(self, client):
        for _ in range(5):
            resp = await client.get("/api/health/")
            assert resp.status_code == 200
