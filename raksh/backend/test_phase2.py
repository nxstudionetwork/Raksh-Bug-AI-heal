"""Phase 2 integration test - validates all backend endpoints."""
import asyncio
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import engine, async_session_factory, get_db
from app.database.models import Base

BASE = "http://test"
PASS = "TestPass123!"
EMAIL = "test@example.com"
NAME = "Test User"


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def test():
    passed = 0
    failed = 0
    errors = []

    async def check(name, condition, detail=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  PASS: {name}")
        else:
            failed += 1
            msg = f"  FAIL: {name} - {detail}"
            print(msg)
            errors.append(msg)

    await init_db()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url=BASE) as c:
        # ---- Health ----
        r = await c.get("/api/health/")
        await check("Health check", r.status_code == 200 and r.json().get("status") == "healthy", str(r.text))
        
        r = await c.get("/api/health/db")
        await check("DB health", r.status_code == 200, str(r.text))

        # ---- Register ----
        r = await c.post("/api/auth/register", json={
            "name": NAME, "email": EMAIL, "password": PASS
        })
        await check("Register user", r.status_code == 200, str(r.text))
        reg_data = r.json()
        await check("Register returns user", "user" in reg_data, str(reg_data))
        await check("Register returns access_token", "access_token" in reg_data, str(reg_data))
        token = reg_data["access_token"]
        refresh = reg_data["refresh_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Duplicate register
        r = await c.post("/api/auth/register", json={
            "name": NAME, "email": EMAIL, "password": PASS
        })
        await check("Duplicate register rejected", r.status_code == 400, str(r.text))

        # ---- Login ----
        r = await c.post("/api/auth/login", json={
            "email": EMAIL, "password": PASS
        })
        await check("Login", r.status_code == 200, str(r.text))
        login_data = r.json()
        token = login_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        r = await c.post("/api/auth/login", json={
            "email": EMAIL, "password": "wrongpass"
        })
        await check("Login wrong password rejected", r.status_code == 401, str(r.text))

        # ---- Refresh token ----
        r = await c.post("/api/auth/refresh", json={
            "refresh_token": refresh
        })
        await check("Refresh token", r.status_code == 200, str(r.text))
        if r.status_code == 200:
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

        # ---- Get Profile ----
        r = await c.get("/api/users/me", headers=headers)
        await check("Get profile", r.status_code == 200, str(r.text))
        profile = r.json()
        await check("Profile has email", profile.get("email") == EMAIL, str(profile))

        # ---- Update Profile ----
        r = await c.put("/api/users/me", headers=headers, json={"name": "Updated User"})
        await check("Update profile", r.status_code == 200, str(r.text))
        await check("Profile name updated", r.json().get("name") == "Updated User", str(r.text))

        # ---- Get Settings ----
        r = await c.get("/api/users/me/settings", headers=headers)
        await check("Get settings", r.status_code == 200, str(r.text))
        settings = r.json()
        await check("Settings has theme", "theme" in settings, str(settings))

        # ---- Update Settings ----
        r = await c.put("/api/users/me/settings", headers=headers, json={
            "theme": "light", "notifications_enabled": False, "auto_scan": True
        })
        await check("Update settings", r.status_code == 200, str(r.text))
        await check("Settings theme updated", r.json().get("theme") == "light", str(r.text))

        # ---- Forgot Password ----
        r = await c.post("/api/auth/forgot-password", json={"email": EMAIL})
        await check("Forgot password", r.status_code == 200, str(r.text))

        # ---- Dashboard Stats ----
        r = await c.get("/api/dashboard/stats", headers=headers)
        await check("Dashboard stats", r.status_code == 200, str(r.text))
        stats = r.json()
        await check("Dashboard has total_scans", "total_scans" in stats, str(stats))

        # ---- Analyze Message (scan) ----
        r = await c.post("/api/scans/analyze", headers=headers, json={
            "source": "email",
            "sender": "scammer@evil.com",
            "receiver": EMAIL,
            "subject": "Urgent: Your account has been compromised",
            "message_content": "Dear user, your bank account has been compromised. Click here to verify your identity immediately: http://evil-phishing.com/login",
        })
        await check("Analyze message", r.status_code == 200, str(r.text))
        scan = r.json()
        await check("Scan has risk_score", "risk_score" in scan, str(scan))
        await check("Scan has threat_category", "threat_category" in scan, str(scan))
        await check("Scan has explanation", scan.get("explanation"), str(scan))
        await check("Scan has recommendation", scan.get("recommendation"), str(scan))

        # ---- Get Scan History ----
        r = await c.get("/api/scans/", headers=headers)
        await check("Get scan history", r.status_code == 200, str(r.text))
        history = r.json()
        await check("History has total", "total" in history, str(history))
        await check("History has scans", "scans" in history, str(history))
        if history.get("scans"):
            await check("Scan history has items", len(history["scans"]) > 0, str(history))

        # ---- Get Scan Stats ----
        r = await c.get("/api/scans/stats", headers=headers)
        await check("Get scan stats", r.status_code == 200, str(r.text))

        # ---- Get Single Scan ----
        if history.get("scans"):
            scan_id = history["scans"][0]["id"]
            r = await c.get(f"/api/scans/{scan_id}", headers=headers)
            await check("Get single scan", r.status_code == 200, str(r.text))

        # ---- Messages ----
        r = await c.post("/api/messages/", headers=headers, json={
            "source": "email",
            "sender": "friend@example.com",
            "receiver": EMAIL,
            "subject": "Hello",
            "message_content": "Just checking in!",
        })
        await check("Create message", r.status_code == 200, str(r.text))

        r = await c.get("/api/messages/", headers=headers)
        await check("List messages", r.status_code == 200, str(r.text))
        messages = r.json()
        await check("Messages has list", "messages" in messages, str(messages))

        # ---- Notifications ----
        r = await c.get("/api/notifications/", headers=headers)
        await check("List notifications", r.status_code == 200, str(r.text))
        notifs = r.json()
        await check("Notifications has list", "notifications" in notifs, str(notifs))

        r = await c.get("/api/notifications/unread-count", headers=headers)
        await check("Unread count", r.status_code == 200, str(r.text))

        if notifs.get("notifications"):
            nid = notifs["notifications"][0]["id"]
            r = await c.put(f"/api/notifications/{nid}/read", headers=headers)
            await check("Mark notification read", r.status_code == 200, str(r.text))

        r = await c.put("/api/notifications/read-all", headers=headers)
        await check("Mark all read", r.status_code == 200, str(r.text))

        # ---- Connected Apps ----
        r = await c.get("/api/connected-apps/", headers=headers)
        await check("List connected apps", r.status_code == 200, str(r.text))

        r = await c.post("/api/connected-apps/", headers=headers, json={
            "platform": "gmail",
            "credentials": {"email": "test@gmail.com"}
        })
        await check("Connect app", r.status_code == 200, str(r.text))

        r = await c.get("/api/connected-apps/", headers=headers)
        await check("List apps after connect", r.status_code == 200, str(r.text))
        apps = r.json()
        if apps:
            app_id = apps[0]["id"]
            r = await c.put(f"/api/connected-apps/{app_id}", headers=headers, json={
                "monitoring_enabled": True
            })
            await check("Update app", r.status_code == 200, str(r.text))

            r = await c.delete(f"/api/connected-apps/{app_id}", headers=headers)
            await check("Disconnect app", r.status_code == 200, str(r.text))

        # ---- Files (upload) ----
        r = await c.post("/api/files/upload", headers=headers,
            files={"file": ("test.txt", b"Hello world", "text/plain")})
        await check("Upload file", r.status_code == 200, str(r.text))

        r = await c.get("/api/files/", headers=headers)
        await check("List files", r.status_code == 200, str(r.text))
        files = r.json()
        if isinstance(files, list) and files:
            fid = files[0]["id"]
            r = await c.delete(f"/api/files/{fid}", headers=headers)
            await check("Delete file", r.status_code == 200, str(r.text))

        # ---- Auth required ----
        r = await c.get("/api/dashboard/stats")
        await check("No auth rejected", r.status_code in (401, 403), str(r.text))

        # ---- Change password ----
        r = await c.post("/api/auth/change-password", headers=headers, json={
            "current_password": PASS,
            "new_password": "NewPass12345!"
        })
        await check("Change password", r.status_code == 200, str(r.text))

    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed out of {passed + failed} tests")
    if errors:
        print(f"Errors: {errors}")
    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(test())
    sys.exit(0 if success else 1)
