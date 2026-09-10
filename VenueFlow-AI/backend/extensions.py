import os
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config

# Rate Limiter (Forced memory storage for cloud stability)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per day", "200 per hour"],
    storage_uri="memory://"
)

# SocketIO setup
use_broker = os.getenv("USE_REDIS_BROKER", "false").lower() == "true"
socketio = SocketIO(
    cors_allowed_origins="*",
    message_queue=Config.REDIS_URL if use_broker else None,
    async_mode=None
)
