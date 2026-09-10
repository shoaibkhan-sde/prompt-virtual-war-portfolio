"""
VenueFlow AI — Alert Routes
Thin wrapper around alert_service for REST access.
"""

from flask import Blueprint, jsonify, request
from services.alert_service import push_alert, get_recent_alerts

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/api/alerts", methods=["GET"])
def get_alerts():
    """Return the most recent alerts from Redis."""
    return jsonify({"alerts": get_recent_alerts()})

@alerts_bp.route("/api/alerts/broadcast", methods=["POST"])
def broadcast_alert():
    """Operator endpoint — push a custom message via alert_service."""
    body = request.get_json(silent=True) or {}
    alert = push_alert(
        level=body.get("level", "info"),
        category="operator",
        title=body.get("title", "📢 Venue Announcement"),
        message=body.get("message", ""),
        force_immediate=True,
    )
    return jsonify({"status": "broadcast", "alert": alert})
