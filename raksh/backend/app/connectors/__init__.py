from app.connectors.base import BaseConnector
from app.connectors.registry import ConnectorRegistry
from app.connectors.mock_connector import MockConnector

connector_registry = ConnectorRegistry()
connector_registry.register("email", MockConnector)
connector_registry.register("whatsapp", MockConnector)
connector_registry.register("telegram", MockConnector)
