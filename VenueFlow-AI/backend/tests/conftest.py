import pytest
import json
import datetime
from unittest.mock import MagicMock, patch
from app import create_app

@pytest.fixture
def app():
    # Force testing mode
    app = create_app(testing=True)
    app.config.update({
        "TESTING": True,
        "SECRET_KEY": "test_secret"
    })
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def mock_firebase_user():
    return {
        "uid": "test_uid_123",
        "email": "tester@venueflow.ai",
        "name": "Test Pilot",
        "admin": False,
        "iat": datetime.datetime.utcnow().timestamp()
    }

@pytest.fixture
def mock_firebase_admin():
    return {
        "uid": "admin_uid_999",
        "email": "admin@venueflow.ai",
        "name": "Head of Security",
        "admin": True,
        "iat": datetime.datetime.utcnow().timestamp()
    }

@pytest.fixture
def mock_verify_token(monkeypatch):
    """
    Mocks Firebase's verify_id_token specifically in the routes_auth module.
    """
    mock = MagicMock()
    # Path where the function is used in routes_auth.py
    monkeypatch.setattr("api.routes_auth.firebase_auth.verify_id_token", mock)
    return mock
