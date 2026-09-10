from flask import Blueprint, request, jsonify
from ..services.ai_service import AIService
from ..utils.security import sanitize_text, require_auth, require_json
from ..extensions import limiter
import logging

simulation_bp = Blueprint("simulation", __name__)
logger = logging.getLogger(__name__)

@simulation_bp.route("/", methods=["POST"])
@require_json
@require_auth
@limiter.limit("20 per minute")
def simulate():
    try:
        data = request.get_json()
        decision = str(data.get("decision", "proceed"))[:200]
        stats = data.get("stats", {})
        day = max(1, min(int(data.get("day", 1)), 30))
        constituency = str(data.get("constituency", "Rural"))[:50]
        phase = str(data.get("phase", "campaign"))[:30]

        prompt = (
            f"Indian election simulation. Candidate in {constituency} (Phase: {phase}) "
            f"chose on Day {day}: {decision}. Stats: {stats}. "
            "Write exactly 2 sentences describing the consequence."
        )

        narrative, error = AIService.generate_reply(prompt)
        if error:
            narrative = "The campaign continues to unfold across the constituency."
            
        return jsonify({
            "narrative": narrative,
            "stat_changes": {"trust": 2, "reach": 5, "momentum": 3},
            "xp_earned": 20,
        }), 200
    except Exception as e:
        logger.error("Simulation error: %s", str(e))
        return jsonify({"error": "Internal error"}), 500
