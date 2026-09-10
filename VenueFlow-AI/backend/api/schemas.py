from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class ChatRequestSchema(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: Optional[List[dict]] = Field(default_factory=list)

class OptimalGateRequestSchema(BaseModel):
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lon: Optional[float] = Field(default=None, ge=-180, le=180)
    top_k: Optional[int] = Field(default=1, ge=1, le=10)

class RebalanceRequestSchema(BaseModel):
    total_incoming: int = Field(..., ge=1, le=1000000)

class AuthVerifySchema(BaseModel):
    # Used for demo purposes
    email: EmailStr
    token: str
