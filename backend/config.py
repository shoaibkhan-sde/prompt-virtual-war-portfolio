import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "prod-secret-must-be-set-in-env")
    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"
    
    # Redis configuration for Limiter
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
    
    # Gemini / Vertex AI
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    VERTEX_PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
    VERTEX_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

class DevelopmentConfig(Config):
    DEBUG = True
    RATELIMIT_STORAGE_URI = "memory://" # Fallback for local dev if no redis

class ProductionConfig(Config):
    DEBUG = False
    RATELIMIT_STORAGE_URI = os.environ.get("REDIS_URL", "memory://")

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    RATELIMIT_STORAGE_URI = "memory://"
    GEMINI_API_KEY = "test-key"

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig
}
