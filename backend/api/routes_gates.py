"""
VenueFlow AI — Gate Routing Routes
GET /api/gates           → all gate statuses
GET /api/gates/optimal   → fastest gate for a user position
POST /api/gates/rebalance → load-balance incoming crowd
"""

from flask import Blueprint, request, jsonify
from core.models import Gate
from core.analyzer import find_fastest_gate, rebalance_crowd
from services.maps_service import distances_to_gates
from services.redis_service import get_all_gates, set_gate, get_event_phase
from services.audit_service import audit_logger
from api.routes_auth import token_required, admin_required
from api.schemas import OptimalGateRequestSchema, RebalanceRequestSchema
from pydantic import ValidationError

gates_bp = Blueprint("gates", __name__)


def _gate_dict(g: Gate) -> dict:
    return {
        "gateId": g.gate_id,
        "name": g.name,
        "type": "gate",
        "zone": g.zone,
        "lat": g.latitude,
        "lon": g.longitude,
        "capacity": g.capacity,
        "currentQueue": g.current_queue,
        "throughputRate": g.throughput_rate,
        "estimatedWaitSec": round(g.estimated_wait_seconds, 1) if g.estimated_wait_seconds != float("inf") else 99999,
        "waitTime": round(g.estimated_wait_seconds / 60, 1) if g.estimated_wait_seconds != float("inf") else 999,
        "isOpen": g.is_open,
    }


@gates_bp.route("/api/gates", methods=["GET"])
def list_gates():
    """Return status of all gates."""
    gates = get_all_gates()
    return jsonify({"gates": [_gate_dict(g) for g in gates]})


@gates_bp.route("/api/gates/optimal", methods=["GET"])
def optimal_gate():
    """
    Find the fastest gate for a user.
    Query params: lat, lon, top_k (optional, default 3)
    """
    try:
        # Pydantic validation for GET parameters (via dict conversion)
        args = request.args.to_dict()
        req_data = OptimalGateRequestSchema(**args)
    except ValidationError as e:
        return jsonify({"error": "Invalid query parameters", "details": e.errors()}), 400

    gates = get_all_gates()
    
    # Efficient fallback: If coords are missing, skip the Map service and treat distances as 0.0
    if req_data.lat is not None and req_data.lon is not None:
        user_dists = distances_to_gates(req_data.lat, req_data.lon, gates)
    else:
        user_dists = {}

    current_phase = get_event_phase()
    results = find_fastest_gate(gates, user_dists, top_k=req_data.top_k, event_phase=current_phase)

    return jsonify({
        "recommendations": [
            {
                "gate": _gate_dict(r.gate),
                "estimatedWaitSec": round(r.estimated_wait_seconds, 1) if r.estimated_wait_seconds != float("inf") else 99999,
                "predictedWaitSec": round(r.predicted_wait_seconds, 1) if r.predicted_wait_seconds != float("inf") else 99999,
                "distanceMeters": round(r.distance_meters, 1),
                "compositeScore": r.composite_score,
            }
            for r in results
        ]
    })


@gates_bp.route("/api/gates/rebalance", methods=["POST"])
@token_required
@admin_required
def rebalance(current_user):
    """
    Load-balance incoming attendees across open gates.
    Body: { "total_incoming": 500 }
    """
    body = request.get_json(silent=True) or {}
    
    try:
        req_data = RebalanceRequestSchema(**body)
    except ValidationError as e:
        return jsonify({"error": "Invalid input", "details": e.errors()}), 400

    gates = get_all_gates()
    assignments = rebalance_crowd(gates, req_data.total_incoming)
    
    # Commit modified queues into persistence layer
    modified_gates = []
    for g in gates:
        delta = assignments.get(g.gate_id, 0)
        if delta > 0:
            g.current_queue += delta
            set_gate(g)
            modified_gates.append(g.gate_id)
    
    # Audit high-impact admin action
    audit_logger.log("GATE_REBALANCE_ACTION", "SUCCESS", 
                     user_email=current_user['email'], 
                     metadata={
                         "total_incoming": req_data.total_incoming,
                         "affected_gates": modified_gates
                     })
            
    return jsonify({
        "status": "success",
        "assignments": assignments, 
        "admin": current_user['email'],
        "affected_gates": modified_gates
    })
