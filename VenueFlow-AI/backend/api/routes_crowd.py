"""
VenueFlow AI — Crowd Data Routes
GET /api/crowd  → current zone densities and wait-time estimates.
"""

from flask import Blueprint, jsonify
from core.models import Zone
from services.redis_service import get_all_zones, set_zone

crowd_bp = Blueprint("crowd", __name__)

def _zone_dict(z: Zone) -> dict:
    return {
        "zoneId": z.zone_id,
        "name": z.name,
        "type": "area",
        "capacity": z.capacity,
        "lat": z.latitude,
        "lon": z.longitude,
        "currentOccupancy": z.current_occupancy,
        "peakOccupancy": z.peak_occupancy,
        "density": round(z.density, 3),
        "status": z.status,
        "waitTime": 0,  # Areas currently don't have simulated wait times
    }


@crowd_bp.route("/api/crowd", methods=["GET"])
def get_crowd_data():
    """Return live crowd data for all zones."""
    zones = get_all_zones()
    return jsonify({
        "zones": [_zone_dict(z) for z in zones],
        "totalOccupancy": sum(z.current_occupancy for z in zones),
        "totalCapacity": sum(z.capacity for z in zones),
    })


def update_zone(zone_id: str, occupancy: int):
    """Helper called by the simulation feed to update zone occupancy."""
    zones = get_all_zones()
    for z in zones:
        if z.zone_id == zone_id:
            z.current_occupancy = max(0, min(occupancy, z.capacity))
            set_zone(z)
            break

from flask import request
from extensions import socketio
from services.redis_service import get_all_gates, set_gate, set_event_phase, get_event_phase
from core.analyzer import find_fastest_gate, rebalance_crowd
from services.maps_service import distances_to_gates
from api.routes_auth import token_required

# Note: We duplicate _gate_dict temporarily for simplicity, or we should import it if it's still in routes_gates.
# Let's import it from api.routes_gates to avoid duplication.
from api.routes_gates import _gate_dict
from services.crowd_service import process_tick_data, _zone_dict

@crowd_bp.route("/api/internal/tick", methods=["POST"])
@token_required
def simulation_tick(current_user):
    """Internal endpoint: Simulation feeds new zone/gate data here."""
    data = request.json or {}
    process_tick_data(data)
    return jsonify({"status": "updated"})
