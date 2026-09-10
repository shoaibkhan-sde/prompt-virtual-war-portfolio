"""
VenueFlow AI — Alert Service
Centralized engine for managing, persisting, and broadcasting venue alerts.
Hybrid Storage: Uses Redis for cross-process sync, and local memory for fail-safe fallback.
"""

import json
import time
from datetime import datetime, timezone
from collections import deque
from extensions import socketio
from services.redis_service import redis_client, REDIS_UP

ALERTS_LOG_KEY = "vf_alert_log"
ID_COUNTER_KEY = "vf_alert_id_counter"
MAX_ALERTS = 10 

# Local Fallback Store (Ensures Zero-Blackout logic)
_local_alert_log = deque(maxlen=MAX_ALERTS)
_local_id_seed = int(time.time())

NOMENCLATURE = {
    "east-wing": "East Stand",
    "west-wing": "West Stand",
    "food-court-north": "North Food Hub",
    "food-court-south": "South Food Hub",
    "parking-a": "Parking (Zone A)",
}

def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()

def _translate(text: str) -> str:
    for old, new in NOMENCLATURE.items():
        text = text.replace(old, new)
    return text

def push_alert(level: str, category: str, title: str, message: str, entity_id: str = ""):
    """
    Creates an alert. Persists to Redis if available, 
    otherwise stores in local memory. ALWAYS broadcasts.
    """
    # 1. Generate ID (Redis-backed or Timestamp fallback)
    alert_id = None
    if REDIS_UP:
        try:
            alert_id = redis_client.incr(ID_COUNTER_KEY)
        except Exception:
            pass
    
    if not alert_id:
        # Fallback ID logic
        global _local_id_seed
        _local_id_seed += 1
        alert_id = _local_id_seed

    # 2. Build Object
    alert = {
        "id": alert_id,
        "timestamp": _ts(),
        "level": level,
        "category": category,
        "title": _translate(title),
        "message": _translate(message),
        "entityId": entity_id,
    }

    # 3. Store (Redis + Local)
    _local_alert_log.appendleft(alert)
    
    if REDIS_UP:
        try:
            redis_client.lpush(ALERTS_LOG_KEY, json.dumps(alert))
            # Strict logic: Ensure storage NEVER exceeds 10
            redis_client.ltrim(ALERTS_LOG_KEY, 0, MAX_ALERTS - 1)
        except Exception as e:
            print(f"[ALERT ERR] Redis persistence failed: {e}")

    # 4. ALWAYS broadcast to socket (Critical for data visibility)
    try:
        socketio.emit("alert_event", alert)
    except Exception as e:
        print(f"[ALERT ERR] Socket broadcast failed: {e}")

    return alert

def get_recent_alerts():
    """Fetches alerts from Redis (master) or Local Memory (fallback)."""
    if REDIS_UP:
        try:
            # Strictly return only 0 to 9 to match logic power requirements
            raw_list = redis_client.lrange(ALERTS_LOG_KEY, 0, MAX_ALERTS - 1)
            if raw_list:
                return [json.loads(a) for a in raw_list]
        except Exception:
            pass
    
    # Fallback to local memory if Redis is empty or down
    return list(_local_alert_log)

def purge_old_history():
    """Run once to clear history larger than 10 to reset state to new requirements."""
    if REDIS_UP:
        try:
            redis_client.ltrim(ALERTS_LOG_KEY, 0, MAX_ALERTS - 1)
        except:
            pass

# ── Intelligence Evaluation Logic ───────────────────────────────

_zone_prev_status = {}
_gate_prev_status = {}

def evaluate_metrics(zones=None, gates=None):
    if zones:
        for z in zones:
            prev = _zone_prev_status.get(z["zoneId"], "low")
            curr = z["status"]
            if curr == prev: continue
            _zone_prev_status[z["zoneId"]] = curr

            # 🛠️ PROMOTING 'HIGH' TO 'CRITICAL' PER USER REQUEST
            if curr == "critical":
                push_alert("critical", "zone", f"🔴 {z['name']} — AT CAPACITY", 
                           f"Density at {z['density']*100:.0f}%. Directing fans to alternate lanes immediately.")
            elif curr == "high":
                # Upgraded to 'critical' level so it shows as Red in feed to match Crowd tab Red cards
                push_alert("critical", "zone", f"🛑 {z['name']} — HEAVY FLOW", 
                           f"Heavy congestion detected ({z['density']*100:.0f}% full). Zone entering critical state.")
            elif curr == "moderate":
                push_alert("warning", "zone", f"🟠 {z['name']} — Moderate", 
                           f"Growing crowd detected ({z['density']*100:.0f}% full).")
            elif curr == "low" and prev in ("critical", "high", "moderate"):
                push_alert("info", "zone", f"✅ {z['name']} — Fluid", 
                           f"Mobility restored. Area is now {z['density']*100:.0f}% utilized.")

    if gates:
        for g in gates:
            prev_status = _gate_prev_status.get(g["gateId"], "normal")
            curr_wait = g.get("waitTime", 0)
            is_open = g.get("isOpen", True)
            
            if not is_open: new_status = "closed"
            elif curr_wait > 90: new_status = "heavy"
            elif curr_wait < 40: new_status = "clear"
            else: new_status = "normal"

            if new_status == prev_status: continue
            _gate_prev_status[g["gateId"]] = new_status

            if new_status == "heavy":
                # Gates also promoted to critical level if wait exceeds 90s
                push_alert("critical", "gate", f"⏱️ {g['name']} — OVERLOADED", f"Wait time peaked at {curr_wait:.0f}s. Use alternate gates.")
            elif new_status == "clear":
                push_alert("info", "gate", f"💎 {g['name']} — Optimum", f"Empty entry path cleared ({curr_wait:.0f}s wait).")
            elif new_status == "closed":
                push_alert("critical", "gate", f"🚫 {g['name']} — CLOSED", f"Emergency gate closure. Rerouting traffic.")
            elif new_status == "normal" and prev_status in ("heavy", "closed"):
                push_alert("info", "gate", f"✅ {g['name']} — Fluid", f"Gate wait dropped to {curr_wait:.0f}s.")
