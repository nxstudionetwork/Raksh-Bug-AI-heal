from typing import Dict, Optional, Type
from app.connectors.base import BaseConnector


class ConnectorRegistry:
    def __init__(self):
        self._connectors: Dict[str, Type[BaseConnector]] = {}
        self._instances: Dict[str, BaseConnector] = {}
    
    def register(self, platform: str, connector_class: Type[BaseConnector]):
        self._connectors[platform] = connector_class
    
    def get_connector_class(self, platform: str) -> Optional[Type[BaseConnector]]:
        return self._connectors.get(platform)
    
    def get_instance(self, platform: str, app_id: int, user_id: int, config: dict = None) -> Optional[BaseConnector]:
        key = f"{platform}_{app_id}"
        if key not in self._instances:
            cls = self.get_connector_class(platform)
            if cls:
                self._instances[key] = cls(app_id, user_id, config)
        return self._instances.get(key)
    
    def remove_instance(self, platform: str, app_id: int):
        key = f"{platform}_{app_id}"
        self._instances.pop(key, None)
    
    def list_available(self) -> list:
        return list(self._connectors.keys())
    
    def list_instances(self) -> list:
        return [{"key": k, "connected": v.is_connected} for k, v in self._instances.items()]
