import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import get_db


@pytest.fixture
def client(override_get_db):
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


class TestHealth:
    async def test_health_check(self, client):
        resp = await client.get("/api/health/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200


class TestAuth:
    async def test_register(self, client):
        resp = await client.post("/api/auth/register", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "SecureP@ss123",
        })
        assert resp.status_code == 200 or resp.status_code == 400

    async def test_login_invalid(self, client):
        resp = await client.post("/api/auth/login", json={
            "email": "noone@test.com",
            "password": "wrong",
        })
        assert resp.status_code == 401


class TestDocs:
    async def test_docs_available(self, client):
        resp = await client.get("/api/docs")
        assert resp.status_code in (200, 302, 303)

    async def test_openapi(self, client):
        resp = await client.get("/api/openapi.json")
        assert resp.status_code == 200
        assert "openapi" in resp.json()
