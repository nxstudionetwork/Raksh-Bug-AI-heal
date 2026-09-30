from app.api.controllers import auth
from app.api.controllers import users
from app.api.controllers import messages
from app.api.controllers import scans
from app.api.controllers import notifications
from app.api.controllers import dashboard
from app.api.controllers import connected_apps
from app.api.controllers import health
from app.api.controllers import settings as settings_controller
from app.api.controllers import files

routers = [
    auth.router,
    users.router,
    messages.router,
    scans.router,
    notifications.router,
    dashboard.router,
    connected_apps.router,
    health.router,
    settings_controller.router,
    files.router,
]