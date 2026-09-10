from flask import Blueprint, jsonify
from ..utils.security import require_auth, require_json

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/confusion", methods=["POST"])
@require_json
@require_auth
def confusion():
    return jsonify({"logged": True, "sage_message": "🦉 I'm here to help!"}), 200
