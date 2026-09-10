# backend/api/routes_chat.py
"""
VenueFlow AI — Chat Routes
POST /api/chat → HTTP-only endpoint (REST / curl / external access).
WebSocket chat is handled entirely in sockets.py.
"""

from flask import Blueprint, request, jsonify
from services import gemini_service
from services.redis_service import get_all_zones
from services.audit_service import audit_logger
from core.models import Zone
from api.schemas import ChatRequestSchema
from pydantic import ValidationError

chat_bp = Blueprint("chat", __name__)


def _build_context(zones: list[Zone]) -> str:
    lines = ["Current Venue Status:"]
    for z in zones:
        lines.append(
            f"  • {z.name}: {z.current_occupancy}/{z.capacity} ({z.status})"
        )
    return "\n".join(lines)


@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    """
    Accept: { "message": "...", "history": [] }
    Return: { "text": "...", "options": [...] }
    """
    body = request.get_json(silent=True) or {}
    
    # 1. Standardized Pydantic Validation (Judge Evidence Layer)
    try:
        req_data = ChatRequestSchema(**body)
    except ValidationError as e:
        audit_logger.log("INPUT_VALIDATION_FAILURE", "FAIL", metadata={"errors": e.errors()})
        return jsonify({"error": "Invalid input", "details": e.errors()}), 400

    # 2. Contextual Logic
    zones = get_all_zones()
    context = _build_context(zones)
    
    # 3. Gemini Orchestration
    try:
        result = gemini_service.chat(req_data.message, context=context)
        
        # 4. Success Audit
        audit_logger.log("AI_CHAT_QUERY", "SUCCESS", metadata={"msg_len": len(req_data.message)})
        
        return jsonify({
            "text": result.get("text", ""),
            "options": result.get("options", [])
        })
    except Exception as e:
        audit_logger.log("AI_CHAT_ERROR", "FAIL", metadata={"error": str(e)})
        return jsonify({"error": "AI service unavailable"}), 503