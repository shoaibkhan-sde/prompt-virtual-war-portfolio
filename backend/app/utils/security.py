import bleach
from functools import wraps
from flask import request, jsonify
from firebase_admin import auth
import logging
from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)

from typing import List, Optional, Dict

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    history: List[Dict[str, str]] = []
    appContext: Dict = {}

class QuizSubmitRequest(BaseModel):
    answers: List[Dict]
    quizId: Optional[str] = "default"

    @validator('answers')
    def validate_answers(cls, v):
        if len(v) > 20:
            raise ValueError("Max 20 answers allowed")
        return v

class SimulateRequest(BaseModel):
    decision: str = Field(..., max_length=200)
    stats: Dict[str, int]
    day: int = Field(..., ge=1, le=30)
    constituency: str = "Rural"
    phase: str = "campaign"

def sanitize_text(text: str, max_length: int = 500) -> str:

    """
    Clean text using bleach (strips HTML) and enforces length.
    """
    if not isinstance(text, str):
        raise ValueError("Input must be a string")
    
    # bleach.clean strips all tags by default
    cleaned = bleach.clean(text, tags=[], attributes={}, strip=True).strip()
    
    if not cleaned:
        raise ValueError("Input cannot be empty")
    
    if len(cleaned) > max_length:
        raise ValueError(f"Input must not exceed {max_length} characters")
        
    return cleaned

def require_auth(func):
    """
    Soft auth decorator. Injects request.user if valid token present.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        request.user = None
        auth_header = request.headers.get("Authorization", "")
        
        if auth_header.startswith("Bearer "):
            id_token = auth_header.split("Bearer ", 1)[1].strip()
            if id_token and id_token not in ("undefined", "null", ""):
                try:
                    decoded_token = auth.verify_id_token(id_token)
                    request.user = decoded_token
                except Exception as e:
                    logger.warning("Auth token invalid: %s", str(e))
        
        return func(*args, **kwargs)
    return wrapper

def require_json(func):
    """Enforce application/json."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json", "code": "INVALID_CONTENT_TYPE"}), 415
        return func(*args, **kwargs)
    return wrapper
