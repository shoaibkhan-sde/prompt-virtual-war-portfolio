from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
import os
import logging

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Extensions
limiter = Limiter(key_func=get_remote_address)
talisman = Talisman()
cors = CORS()

def init_firebase():
    """Initialize Firebase Admin SDK."""
    try:
        if not firebase_admin._apps:
            cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "serviceAccountKey.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized with service account")
            else:
                firebase_admin.initialize_app()
                logger.info("Firebase Admin initialized with default credentials")
    except Exception as e:
        logger.error("Failed to initialize Firebase Admin: %s", str(e))
