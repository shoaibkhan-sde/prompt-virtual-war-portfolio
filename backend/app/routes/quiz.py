from flask import Blueprint, request, jsonify
from ..services.quiz_service import QuizService
from ..services.ai_service import AIService
from ..utils.security import require_auth, require_json
from ..utils.errors import error_response
from ..extensions import limiter
import json
import logging

quiz_bp = Blueprint("quiz", __name__)
logger = logging.getLogger(__name__)

@quiz_bp.route("/submit", methods=["POST"])
@require_json
@require_auth
@limiter.limit("20 per minute")
def submit():
    try:
        data = request.get_json()
        answers = data.get("answers", [])
        
        if not isinstance(answers, list) or len(answers) > 20:
            return error_response("Invalid answers array", status_code=400)
            
        score, feedback = QuizService.calculate_score(answers)
        return jsonify({"score": score, "total": len(answers), "feedback": feedback}), 200
    except Exception as e:
        logger.error("Quiz submit error: %s", str(e))
        return error_response("Internal error", details=str(e), status_code=500)

@quiz_bp.route("/adaptive", methods=["POST"])
@require_json
@require_auth
def adaptive():
    data = request.get_json()
    last_result = bool(data.get("lastResult", True))
    current_difficulty = str(data.get("currentDifficulty", "easy"))
    weak_topics = data.get("weakTopics", [])
    
    next_difficulty = QuizService.get_adaptive_difficulty(current_difficulty, last_result)
    focus_topic = weak_topics[0] if weak_topics else None
    
    return jsonify({
        "status": "ready",
        "nextDifficulty": next_difficulty,
        "focusTopic": focus_topic,
    }), 200

@quiz_bp.route("/generate", methods=["POST"])
@require_json
@require_auth
@limiter.limit("15 per minute")
def generate():
    data = request.get_json()
    stage = str(data.get("stage", "announcement"))[:50]
    difficulty = str(data.get("difficulty", "easy"))[:20]
    
    prompt = (
        f"Generate a unique, high-quality multiple-choice quiz question about the '{stage}' "
        f"stage of the Indian Election process. Difficulty: '{difficulty}'.\n"
        "Respond ONLY with valid JSON: {question, options, correctIndex, explanation, xpReward}"
    )
    
    reply, error = AIService.generate_reply(prompt)
    if error:
        return error_response("AI failed", details=error, status_code=503)
        
    try:
        # Simple cleanup if AI adds markdown
        if "```json" in reply:
            reply = reply.split("```json")[1].split("```")[0].strip()
        elif "```" in reply:
            reply = reply.split("```")[1].split("```")[0].strip()
            
        # Extract json object if there is extra text
        start_idx = reply.find('{')
        end_idx = reply.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            reply = reply[start_idx:end_idx+1]
            
        quiz_data = json.loads(reply)
        return jsonify(quiz_data), 200
    except Exception as e:
        logger.error("Quiz parse error: %s. Reply was: %s", str(e), reply)
        return error_response("Failed to parse AI response", details=str(e), status_code=500)
