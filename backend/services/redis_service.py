"""
VenueFlow AI — Redis Service
Manages real-time state for zones and gates across the backend.
"""

import redis
import json
import os
from config import Config
from core.models import Gate, Zone
from services.firebase_service import get_db, is_firebase_active

# Initialize Redis client with tight timeouts
redis_client = redis.from_url(
    Config.REDIS_URL, 
    decode_responses=True,
    socket_connect_timeout=0.5,  # 500ms
    socket_timeout=0.5          # 500ms
)

# Global Circuit Breaker Flag
REDIS_UP = True

# Prefix constants
ZONE_PREFIX = "zone:"
GATE_PREFIX = "gate:"
EVENT_PHASE_KEY = "event_phase"

# Fallback values if Redis is empty (seeded for demo)
DEFAULT_ZONES = [
    Zone("north-stand", "North Stand", 25000, 23.0330, 72.5260, current_occupancy=18200),
    Zone("south-stand", "South Stand", 25000, 23.0295, 72.5260, current_occupancy=12400),
    Zone("east-wing",   "East Stand",   20000, 23.0312, 72.5285, current_occupancy=19500),
    Zone("west-wing",   "West Stand",   20000, 23.0312, 72.5235, current_occupancy=8700),
    Zone("food-court-north", "North Food Hub", 5000, 23.0325, 72.5275, current_occupancy=3200),
    Zone("food-court-south", "South Food Hub", 5000, 23.0300, 72.5245, current_occupancy=1100),
    Zone("vip-lounge",  "VIP Lounge",   2000,  23.0315, 72.5255, current_occupancy=850),
    Zone("parking-a",   "Parking (Zone A)", 3000,  23.0350, 72.5260, current_occupancy=2100),
]

DEFAULT_GATES = [
    Gate("gate-n1", "North Gate 1", "north-stand", 23.0335, 72.5265, capacity=500, current_queue=120, throughput_rate=2.5),
    Gate("gate-n2", "North Gate 2", "north-stand", 23.0340, 72.5270, capacity=500, current_queue=85,  throughput_rate=2.0),
    Gate("gate-s1", "South Gate 1", "south-stand", 23.0290, 72.5265, capacity=600, current_queue=200, throughput_rate=3.0),
    Gate("gate-s2", "South Gate 2", "south-stand", 23.0285, 72.5260, capacity=600, current_queue=45,  throughput_rate=2.8),
    Gate("gate-e1", "East Gate 1",  "east-wing",   23.0310, 72.5300, capacity=400, current_queue=310, throughput_rate=2.0),
    Gate("gate-w1", "West Gate 1",  "west-wing",   23.0310, 72.5230, capacity=400, current_queue=60,  throughput_rate=1.5),
    Gate("gate-vip", "VIP Entrance", "vip-lounge", 23.0320, 72.5250, capacity=200, current_queue=10,  throughput_rate=1.0),
]

# Robust local cache fallback
_local_zones_dict = {z.zone_id: z for z in DEFAULT_ZONES}
_local_gates_dict = {g.gate_id: g for g in DEFAULT_GATES}
_local_event_phase = "Normal"

PERSISTENCE_FILE = os.path.join(os.path.dirname(__file__), "..", "persistence.json")

def _save_to_firestore():
    """Secondary cloud persistence: Sync local state to Firestore."""
    if not is_firebase_active():
        return
    db = get_db()
    try:
        # Sync Zones
        for zid, z in _local_zones_dict.items():
            db.collection("zones").document(zid).set({
                "zone_id": z.zone_id, "name": z.name, "capacity": z.capacity,
                "latitude": z.latitude, "longitude": z.longitude,
                "current_occupancy": z.current_occupancy,
                "peak_occupancy": z.peak_occupancy
            })
        # Sync Gates
        for gid, g in _local_gates_dict.items():
            db.collection("gates").document(gid).set({
                "gate_id": g.gate_id, "name": g.name, "zone": g.zone,
                "latitude": g.latitude, "longitude": g.longitude,
                "capacity": g.capacity, "current_queue": g.current_queue,
                "throughput_rate": g.throughput_rate, "is_open": g.is_open
            })
        # Sync Event Phase
        db.collection("config").document("stadium").set({"event_phase": _local_event_phase}, merge=True)
    except Exception as e:
        print(f"[DEBUG] Firestore Sync Error: {e}")

def _save_local_to_disk():
    """Fallback persistence: Save local cache to JSON and Firestore."""
    try:
        data = {
            "zones": {zid: {
                "zone_id": z.zone_id, "name": z.name, "capacity": z.capacity,
                "latitude": z.latitude, "longitude": z.longitude,
                "current_occupancy": z.current_occupancy
            } for zid, z in _local_zones_dict.items()},
            "gates": {gid: {
                "gate_id": g.gate_id, "name": g.name, "zone": g.zone, 
                "latitude": g.latitude, "longitude": g.longitude,
                "capacity": g.capacity, "current_queue": g.current_queue,
                "throughput_rate": g.throughput_rate, "is_open": g.is_open
            } for gid, g in _local_gates_dict.items()},
            "event_phase": _local_event_phase
        }
        with open(PERSISTENCE_FILE, "w") as f:
            json.dump(data, f, indent=2)
        
        # Also attempt cloud sync
        _save_to_firestore()
    except Exception as e:
        print(f"[DEBUG] Could not save persistence file: {e}")

def _safe_zone_from_dict(d: dict) -> Zone:
    """Safely reconstruct a Zone from a dict with defaults for missing elite fields."""
    return Zone(
        zone_id=d.get("zone_id", "unknown"),
        name=d.get("name", "Unknown Zone"),
        capacity=int(d.get("capacity", 25000)),
        latitude=float(d.get("latitude", 0.0)),
        longitude=float(d.get("longitude", 0.0)),
        level=int(d.get("level", 1)),
        current_occupancy=int(d.get("current_occupancy", 0)),
        peak_occupancy=int(d.get("peak_occupancy", 0))
    )

def _safe_gate_from_dict(d: dict) -> Gate:
    """Safely reconstruct a Gate from a dict with defaults for missing elite fields."""
    return Gate(
        gate_id=d.get("gate_id", "unknown"),
        name=d.get("name", "Unknown Gate"),
        zone=d.get("zone", "unknown"),
        latitude=float(d.get("latitude", 0.0)),
        longitude=float(d.get("longitude", 0.0)),
        capacity=int(d.get("capacity", 500)),
        level=int(d.get("level", 1)),
        current_queue=int(d.get("current_queue", 0)),
        throughput_rate=float(d.get("throughput_rate", 1.0)),
        is_open=(d.get("is_open", "True") == "True" or d.get("is_open") is True)
    )

def _load_from_firestore():
    """Attempt to pull the latest truth from Firestore."""
    if not is_firebase_active():
        return False
    db = get_db()
    try:
        # 1. Load Zones
        docs = db.collection("zones").get()
        if docs:
            for doc in docs:
                data = doc.to_dict()
                _local_zones_dict[doc.id] = _safe_zone_from_dict(data)
        
        # 2. Load Gates
        docs = db.collection("gates").get()
        if docs:
            for doc in docs:
                data = doc.to_dict()
                _local_gates_dict[doc.id] = _safe_gate_from_dict(data)
            
        # 3. Load Event Phase
        conf = db.collection("config").document("stadium").get()
        if conf.exists:
            global _local_event_phase
            _local_event_phase = conf.to_dict().get("event_phase", "Normal")
        
        print("[OK] State synchronized from Firestore")
        return True
    except Exception as e:
        print(f"[DEBUG] Firestore Load Error (falling back): {e}")
        return False

def _load_local_from_disk():
    """Fallback persistence: Load local cache from Firestore (preferred) or JSON."""
    global _local_event_phase
    
    # Priority 1: Firestore (Global Truth)
    if _load_from_firestore():
        print("[OK] Loaded state from Firestore")
        return

    # Priority 2: Local JSON (Legacy Fallback)
    if not os.path.exists(PERSISTENCE_FILE):
        return
    try:
        with open(PERSISTENCE_FILE, "r") as f:
            data = json.load(f)
            
        for zid, val in data.get("zones", {}).items():
            _local_zones_dict[zid] = Zone(**val)
            
        for gid, val in data.get("gates", {}).items():
            _local_gates_dict[gid] = Gate(**val)
            
        _local_event_phase = data.get("event_phase", "Normal")
        print("[OK] Loaded state from persistence.json")
    except Exception as e:
        print(f"[DEBUG] Could not load persistence file: {e}")

def init_redis_data():
    """Seed redis if empty and synchronize names to current nomenclature (Fast)."""
    global REDIS_UP
    if not REDIS_UP:
        return
    try:
        # 1. Standard Zone Sync (Name Correction)
        for z in DEFAULT_ZONES:
            if not redis_client.exists(f"{ZONE_PREFIX}{z.zone_id}"):
                set_zone(z, sync_to_cloud=False)
            else:
                # Key exists - force update name/capacity to match nomenclature
                redis_client.hset(f"{ZONE_PREFIX}{z.zone_id}", mapping={
                    "name": z.name,
                    "capacity": z.capacity
                })
        
        # 2. Gate Sync (Name & Zone Correction)
        for g in DEFAULT_GATES:
            if not redis_client.exists(f"{GATE_PREFIX}{g.gate_id}"):
                set_gate(g, sync_to_cloud=False)
            else:
                redis_client.hset(f"{GATE_PREFIX}{g.gate_id}", mapping={
                    "name": g.name,
                    "zone": g.zone
                })
                
        if not redis_client.exists(EVENT_PHASE_KEY):
            redis_client.set(EVENT_PHASE_KEY, "Normal")
            
        print("[OK] Redis Nomenclature Sync Complete")
    except Exception as e:
        REDIS_UP = False
        print(f"[INFO] State initialization encountered an error: {e}. Falling back to persistence.")
        _load_local_from_disk()

def sync_state_to_cloud():
    """
    Heavy lifting: Synchronizes the final state of all objects to Firestore.
    Designed to run in a background thread to prevent startup timeouts (503).
    """
    print("[INIT] Background Cloud Sync Started...")
    try:
        # Batch write logic or sequential sync
        _save_to_firestore()
        print("[OK] Background Cloud Sync Complete")
    except Exception as e:
        print(f"[ERR] Background Cloud Sync Failed: {e}")

def get_all_zones() -> list[Zone]:
    global REDIS_UP
    # Standard zone IDs to prevent leaked gates from appearing as zones
    VALID_ZONE_IDS = {z.zone_id for z in DEFAULT_ZONES}
    
    if not REDIS_UP:
        return [z for z in _local_zones_dict.values() if z.zone_id in VALID_ZONE_IDS]
    try:
        keys = redis_client.keys(f"{ZONE_PREFIX}*")
        if not keys:
            return [z for z in _local_zones_dict.values() if z.zone_id in VALID_ZONE_IDS]
        
        zones = []
        for key in keys:
            data = redis_client.hgetall(key)
            if data and data.get("zone_id") in VALID_ZONE_IDS:
                zones.append(Zone(
                    zone_id=data.get("zone_id"),
                    name=data.get("name"),
                    capacity=int(data.get("capacity", 0)),
                    latitude=float(data.get("latitude", 0.0)),
                    longitude=float(data.get("longitude", 0.0)),
                    current_occupancy=int(data.get("current_occupancy", 0)),
                    peak_occupancy=int(data.get("peak_occupancy", 0))
                ))
        return zones
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        REDIS_UP = False
        return [z for z in _local_zones_dict.values() if z.zone_id in VALID_ZONE_IDS]

def set_zone(zone: Zone, sync_to_cloud=True):
    global REDIS_UP
    _local_zones_dict[zone.zone_id] = zone
    if not REDIS_UP:
        return
    try:
        # Fetch current stored peak to maintain high-water mark
        stored_peak = 0
        if REDIS_UP:
            stored_data = redis_client.hgetall(f"{ZONE_PREFIX}{zone.zone_id}")
            stored_peak = int(stored_data.get("peak_occupancy", 0)) if stored_data else 0
        
        # New peak is the max of stored and current
        zone.peak_occupancy = max(stored_peak, zone.current_occupancy)

        data = {
            "zone_id": zone.zone_id,
            "name": zone.name,
            "capacity": zone.capacity,
            "latitude": zone.latitude,
            "longitude": zone.longitude,
            "current_occupancy": zone.current_occupancy,
            "peak_occupancy": zone.peak_occupancy
        }
        redis_client.hset(f"{ZONE_PREFIX}{zone.zone_id}", mapping=data)
        # Proactive sync to Firestore for real-time cloud dashboard
        if sync_to_cloud:
            _save_to_firestore()
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        REDIS_UP = False
        _save_local_to_disk()

def get_all_gates() -> list[Gate]:
    global REDIS_UP
    if not REDIS_UP:
        return list(_local_gates_dict.values())
    try:
        keys = redis_client.keys(f"{GATE_PREFIX}*")
        if not keys:
            return list(_local_gates_dict.values())
        
        gates = []
        for key in keys:
            data = redis_client.hgetall(key)
            if data:
                gates.append(Gate(
                    gate_id=data.get("gate_id"),
                    name=data.get("name"),
                    zone=data.get("zone"),
                    latitude=float(data.get("latitude", 0)),
                    longitude=float(data.get("longitude", 0)),
                    capacity=int(data.get("capacity", 0)),
                    current_queue=int(data.get("current_queue", 0)),
                    throughput_rate=float(data.get("throughput_rate", 1.0)),
                    is_open=(data.get("is_open", "True") == "True")
                ))
        return gates
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        REDIS_UP = False
        return list(_local_gates_dict.values())

def set_gate(gate: Gate, sync_to_cloud=True):
    global REDIS_UP
    _local_gates_dict[gate.gate_id] = gate
    if not REDIS_UP:
        return
    try:
        data = {
            "gate_id": gate.gate_id,
            "name": gate.name,
            "zone": gate.zone,
            "latitude": gate.latitude,
            "longitude": gate.longitude,
            "capacity": gate.capacity,
            "current_queue": gate.current_queue,
            "throughput_rate": gate.throughput_rate,
            "is_open": str(gate.is_open)
        }
        redis_client.hset(f"{GATE_PREFIX}{gate.gate_id}", mapping=data)
        # Proactive sync to Firestore for real-time cloud dashboard
        if sync_to_cloud:
            _save_to_firestore()
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        REDIS_UP = False
        _save_local_to_disk()

def get_event_phase() -> str:
    global REDIS_UP
    if not REDIS_UP:
        return _local_event_phase
    try:
        return redis_client.get(EVENT_PHASE_KEY) or _local_event_phase
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        REDIS_UP = False
        return _local_event_phase

def set_event_phase(phase: str):
    global _local_event_phase, REDIS_UP
    _local_event_phase = phase
    if not REDIS_UP:
        return
    try:
        redis_client.set(EVENT_PHASE_KEY, phase)
        _save_to_firestore()
    except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
        REDIS_UP = False
        _save_local_to_disk()
