from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.config.settings import settings
from app.database.session import engine
from app.database.models import Base
from app.utils.websocket_manager import ws_manager
from app.utils.logger import logger
from app.midlleware.rate_limit import RateLimitMiddleware
from app.midlleware.security import SecurityHeadersMiddleware
from app.midlleware.auth_middleware import get_current_user
from app.api.controllers import auth, users, messages, scans, notifications, dashboard, connected_apps, health, files
from app.api.controllers import settings as settings_router
from app.workers.analysis_worker import run_forever, shutdown_worker
from app.services.connector_sync_service import run_connector_sync, shutdown_connector_sync
from app.database.models import User
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} starting...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    worker_task = asyncio.create_task(run_forever())
    connector_task = asyncio.create_task(run_connector_sync())
    yield
    await shutdown_worker()
    await shutdown_connector_sync()
    worker_task.cancel()
    connector_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass
    try:
        await connector_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": request.url.path},
    )

routers = [
    auth.router,
    users.router,
    messages.router,
    scans.router,
    notifications.router,
    dashboard.router,
    connected_apps.router,
    health.router,
    settings_router.router,
    files.router,
]
for r in routers:
    app.include_router(r)

FRONTEND_DIRS = [
    settings.BASE_DIR.parent / "frontend",
    settings.BASE_DIR.parent,
]
for fd in FRONTEND_DIRS:
    if fd.joinpath("login.html").exists():
        app.mount("/", StaticFiles(directory=str(fd), html=True), name=f"frontend_{fd.name}")
        break


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    from app.authentication.jwt import decode_token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    user_id = int(payload["sub"])
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error user={user_id}: {e}")
        ws_manager.disconnect(user_id, websocket)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}
