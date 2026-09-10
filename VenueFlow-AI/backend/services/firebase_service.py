"""
firebase_service.py
VenueFlow AI — Firebase & Firestore Integration
"""

import os
import logging
from typing import Optional, Any

import firebase_admin
from firebase_admin import credentials, firestore

from config import Config

logger = logging.getLogger("venueflow.firebase")

_db: Optional[Any] = None

def init_firebase():
    """Initialize the Firebase Admin SDK."""
    global _db
    try:
        # 1. Attempt detection of existing app
        try:
            app = firebase_admin.get_app()
        except ValueError:
            # 2. Attempt initialization
            # Standard ADC check (works on Cloud Run automatically)
            # Or uses GOOGLE_APPLICATION_CREDENTIALS env var
            cred = credentials.ApplicationDefault()
            app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized via Application Default Credentials.")

        _db = firestore.client(app)
    except Exception as e:
        logger.warning(f"Firebase initialization failed (falling back to local mocks): {e}")
        _db = None

def get_db():
    """Return the Firestore database client."""
    if _db is None:
        init_firebase()
    return _db

def is_firebase_active() -> bool:
    """Check if Firebase is successfully connected."""
    return get_db() is not None
