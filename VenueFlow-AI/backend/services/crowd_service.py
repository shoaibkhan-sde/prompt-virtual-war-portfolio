"""
VenueFlow AI — Crowd Service
Handles processing of sensor ticks and broadcasting real-time updates.
"""

from extensions import socketio
from services.redis_service import (
    get_all_zones, set_zone, 
    get_all_gates, set_gate, 
    set_event_phase, get_event_phase
)
from core.analyzer import find_fastest_gate
from services.maps_service import distances_to_gates

def _zone_dict(z):
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
        "waitTime": 0,
    }

def _gate_dict(g):
    return {
        "gateId": g.gate_id,
        "name": g.name,
        "zone": g.zone,
        "lat": g.latitude,
        "lon": g.longitude,
        "capacity": g.capacity,
        "queue": g.current_queue,
        "throughput": g.throughput_rate,
        "isOpen": g.is_open,
        "waitTime": round(g.estimated_wait_seconds, 1) if g.estimated_wait_seconds != float("inf") else 99999,
        "status": "open" if g.is_open else "closed",
    }

def update_zone(zone_id: str, occupancy: int):
    """Helper called by the simulation feed to update zone occupancy."""
    zones = get_all_zones()
    for z in zones:
        if z.zone_id == zone_id:
            z.current_occupancy = max(0, min(occupancy, z.capacity))
            set_zone(z)
            break

def process_tick_data(data: dict):
    """
    Common logic for processing a simulation tick.
    Updates Redis state and emits Socket.IO events.
    """
    # 1. Update event phase if present
    if "event_phase" in data:
        set_event_phase(data["event_phase"])

    # 2. Update zones
    for zone_update in data.get("zones", []):
        update_zone(zone_update["zoneId"], zone_update["occupancy"])

    # 3. Update gates
    gates = get_all_gates()
    for gate_update in data.get("gates", []):
        for g in gates:
            if g.gate_id == gate_update["gateId"]:
                g.current_queue = max(0, gate_update["queue"])
                if "isOpen" in gate_update:
                    g.is_open = gate_update["isOpen"]
                set_gate(g)
                break

    # Re-fetch state for calculations
    zones = get_all_zones()
    gates = get_all_gates()

    # 4. Emit crowd update
    crowd_data = {
        "zones": [_zone_dict(z) for z in zones],
        "totalOccupancy": sum(z.current_occupancy for z in zones),
        "totalCapacity": sum(z.capacity for z in zones),
    }
    socketio.emit("crowd_update", crowd_data)

    # 5. Calculate optimal gates and emit
    user_dists = distances_to_gates(23.0312, 72.5260, gates)
    current_phase = get_event_phase()
    results = find_fastest_gate(gates, user_dists, top_k=10, event_phase=current_phase)

    gate_dicts = [_gate_dict(g) for g in gates]
    gates_data = {
        "gates": gate_dicts,
        "optimal": [
            {
                "gate": _gate_dict(r.gate),
                "estimatedWaitSec": round(r.estimated_wait_seconds, 1) if r.estimated_wait_seconds != float("inf") else 99999,
                "predictedWaitSec": round(r.predicted_wait_seconds, 1) if r.predicted_wait_seconds != float("inf") else 99999,
                "distanceMeters": round(r.distance_meters, 1),
                "compositeScore": r.composite_score,
            }
            for r in results
        ]
    }
    socketio.emit("gates_update", gates_data)

    # 6. Evaluate alerts (Redis-backed service)
    try:
        from services.alert_service import evaluate_metrics
        evaluate_metrics(zones=crowd_data["zones"], gates=gate_dicts)
    except Exception as e:
        print(f"[CROWD ERR] Alert evaluation failed: {e}")

    # 7. Emit KPI metrics
    open_gates = [g for g in gates if g.is_open]
    avg_wait = (
        round(sum(g.estimated_wait_seconds for g in open_gates) / len(open_gates), 1)
        if open_gates and all(g.estimated_wait_seconds != float("inf") for g in open_gates) else 0
    )
    total_queuing = sum(g.current_queue for g in gates)
    critical_zones = sum(1 for z in zones if z.status == "critical")
    heavy_gates = sum(1 for g in gates if g.is_open and g.estimated_wait_seconds != float("inf") and g.estimated_wait_seconds > 120)

    alert_level = "normal"
    if critical_zones > 0 or heavy_gates >= 2:
        alert_level = "critical"
    elif heavy_gates >= 1 or any(z.status == "high" for z in zones):
        alert_level = "elevated"

    socketio.emit("metrics_update", {
        "alertLevel": alert_level,
        "criticalZones": critical_zones,
        "heavyGates": heavy_gates,
        "avgWaitSec": avg_wait,
        "totalQueuing": total_queuing,
        "totalOccupancy": crowd_data["totalOccupancy"],
        "totalCapacity": crowd_data["totalCapacity"],
        "openGates": len(open_gates),
        "totalGates": len(gates),
    })

    return crowd_data
