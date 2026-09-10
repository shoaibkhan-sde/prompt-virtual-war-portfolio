from flask import Blueprint, request, jsonify
from ..services.ai_service import AIService
from ..utils.security import sanitize_text, require_auth, require_json
from ..utils.errors import error_response
from ..extensions import limiter
import logging

"""
Chat Routes for CivicMind AI.
Provides an authenticated endpoint for interacting with Sage the Mentor.
"""

chat_bp = Blueprint("chat", __name__)
logger = logging.getLogger(__name__)

@chat_bp.route("/", methods=["POST"])
@require_json
@require_auth
@limiter.limit("10 per minute")
def chat():
    """
    Main chat endpoint. 
    Accepts user message and appContext, returns Sage's AI-generated reply.
    """
    try:
        from ..utils.security import ChatRequest
        from pydantic import ValidationError
        
        try:
            data = ChatRequest(**request.get_json())
        except ValidationError as e:
            return error_response("Validation Error", details=e.errors(), status_code=400, code="VALIDATION_ERROR")

        message = sanitize_text(data.message)
        history = data.history
        app_context = data.appContext
        
        # Build system context based on app state
        system_context = ""
        if app_context:
            stage = app_context.get("currentStage")
            if isinstance(stage, dict):
                system_context = f"User is currently at stage: {stage.get('title', 'Unknown')}. Focus on {stage.get('description', 'learning')}."
            elif isinstance(stage, str):
                system_context = f"User is currently at stage: {stage}."

        reply, error = AIService.generate_reply(message, history=history, system_context=system_context)
        
        if error:
            logger.error(f"AI Chat failed. Detail: {error}")
            return error_response("AI failed", details=error, status_code=503, code="AI_ERROR")
            
        return jsonify({"reply": reply}), 200

    except Exception as e:
        logger.error("Chat error: %s", str(e), exc_info=True)
        return error_response("Internal server error", details=str(e), status_code=500)
