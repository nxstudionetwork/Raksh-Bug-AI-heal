import time
from collections import OrderedDict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.config.settings import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    MAX_ENTRIES = 10000

    def __init__(self, app):
        super().__init__(app)
        self._lock = None
        self.requests = OrderedDict()

    def _prune_and_check(self, client_ip: str, window: int, max_requests: int) -> bool:
        now = time.time()
        if client_ip in self.requests:
            self.requests[client_ip] = [
                t for t in self.requests[client_ip]
                if now - t < window
            ]
        if len(self.requests) >= self.MAX_ENTRIES:
            try:
                self.requests.popitem(last=False)
            except KeyError:
                pass
        if len(self.requests.get(client_ip, [])) >= max_requests:
            return True
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip].append(now)
        self.requests.move_to_end(client_ip)
        return False

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api"):
            client_ip = request.client.host if request.client else "unknown"
            window = settings.RATE_LIMIT_WINDOW
            max_requests = settings.RATE_LIMIT_REQUESTS
            if self._prune_and_check(client_ip, window, max_requests):
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Try again in {window} seconds.",
                )
        response = await call_next(request)
        return response
