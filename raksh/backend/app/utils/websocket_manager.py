import json
from typing import Dict, Set, Any
from fastapi import WebSocket
from app.utils.logger import logger


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected: user={user_id}")

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: user={user_id}")

    async def send_personal_message(self, user_id: int, event: str, data: Any):
        if user_id not in self.active_connections:
            return
        payload = json.dumps({"event": event, "data": data})
        dead_connections = set()
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_connections.add(ws)
        for ws in dead_connections:
            self.active_connections[user_id].discard(ws)

    async def broadcast_event(self, event: str, data: Any):
        payload = json.dumps({"event": event, "data": data})
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(user_id, event, data)


ws_manager = ConnectionManager()
