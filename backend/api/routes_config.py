from flask import Blueprint, jsonify
from config import Config

config_bp = Blueprint("config", __name__)

@config_bp.route("/api/config", methods=["GET"])
def get_config():
    """Expose necessary configuration to the frontend."""
    return jsonify({
        "googleMapsApiKey": Config.GOOGLE_MAPS_API_KEY,
        "venueCapacity": Config.VENUE_CAPACITY,
    })
