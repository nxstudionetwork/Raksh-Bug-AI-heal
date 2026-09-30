from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import datetime


class BaseConnector(ABC):
    """Abstract base class for all connectors."""
    
    def __init__(self, app_id: int, user_id: int, config: Dict = None):
        self.app_id = app_id
        self.user_id = user_id
        self.config = config or {}
        self.is_connected = False
        self.last_sync: Optional[datetime] = None
    
    @abstractmethod
    async def connect(self) -> bool:
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict:
        pass
    
    @abstractmethod
    async def fetch_messages(self, limit: int = 10) -> List[Dict]:
        pass
    
    async def reconnect(self) -> bool:
        await self.disconnect()
        return await self.connect()
    
    async def sync(self) -> Dict:
        start = datetime.utcnow()
        messages = await self.fetch_messages()
        self.last_sync = datetime.utcnow()
        return {
            "messages_fetched": len(messages),
            "sync_duration": (datetime.utcnow() - start).total_seconds(),
            "last_sync": self.last_sync.isoformat(),
        }
    
    def get_status(self) -> Dict:
        return {
            "app_id": self.app_id,
            "connected": self.is_connected,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
        }
