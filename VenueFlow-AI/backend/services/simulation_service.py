"""
VenueFlow AI — Simulation Service
Runs a background thread to generate synthetic crowd data periodically.
"""

import time
import random
import threading
from services.crowd_service import process_tick_data

# Use constants from config
INTERVAL_SEC = 30.0

ZONES_META = [
    {"zone_id": "north-stand",       "capacity": 25000, "base": 18200},
    {"zone_id": "south-stand",       "capacity": 25000, "base": 12400},
    {"zone_id": "east-wing",         "capacity": 20000, "base": 19500},
    {"zone_id": "west-wing",         "capacity": 20000, "base": 8700},
    {"zone_id": "food-court-north",  "capacity": 5000,  "base": 3200},
    {"zone_id": "food-court-south",  "capacity": 5000,  "base": 1100},
    {"zone_id": "vip-lounge",        "capacity": 2000,  "base": 850},
    {"zone_id": "parking-a",         "capacity": 3000,  "base": 2100},
]

GATES_META = [
    {"gate_id": "gate-n1",  "queue": 120, "is_open": True},
    {"gate_id": "gate-n2",  "queue": 85,  "is_open": True},
    {"gate_id": "gate-s1",  "queue": 200, "is_open": True},
    {"gate_id": "gate-s2",  "queue": 45,  "is_open": True},
    {"gate_id": "gate-e1",  "queue": 310, "is_open": True},
    {"gate_id": "gate-w1",  "queue": 60,  "is_open": True},
    {"gate_id": "gate-vip", "queue": 10,  "is_open": True},
]

# Event phases (cycles every 5 ticks per phase)
EVENT_PHASES = [
    {
        "name": "🏟️  Pre-match Arrival Surge",
        "zone_targets": {
            "north-stand": 0.88, "south-stand": 0.75, "east-wing": 0.82,
            "west-wing": 0.55,   "food-court-north": 0.60, "food-court-south": 0.35,
            "vip-lounge": 0.70,  "parking-a": 0.92,
        },
        "gate_queue_multiplier": 2.2 # Heavy gates to trigger wait alerts
    },
    {
        "name": "🍟  Half-time RUSH",
        "zone_targets": {
            "north-stand": 0.45, "south-stand": 0.40, "east-wing": 0.50,
            "west-wing": 0.45,   "food-court-north": 0.98, "food-court-south": 0.92,
            "vip-lounge": 0.90,  "parking-a": 0.95,
        },
        "gate_queue_multiplier": 0.8
    },
    {
        "name": "🚨  Post-match Exodus",
        "zone_targets": {
            "north-stand": 0.30, "south-stand": 0.25, "east-wing": 0.35,
            "west-wing": 0.20,   "food-court-north": 0.30, "food-court-south": 0.45,
            "vip-lounge": 0.10,  "parking-a": 0.40,
        },
        "gate_queue_multiplier": 3.0 # Maximum gate wait alerts
    }
]

def _lerp_toward(current: int, target: int, capacity: int, speed=0.30) -> int:
    """Gradually move current toward target occupancy with jitter."""
    diff = target - current
    step = int(diff * speed) + random.randint(-int(capacity * 0.02), int(capacity * 0.02))
    return max(0, min(current + step, capacity))

def generate_payload(zones, gates, tick_count):
    phase_idx = (tick_count // 5) % len(EVENT_PHASES)
    phase = EVENT_PHASES[phase_idx]
    
    zones_payload, gates_payload = [], []
    for zone in zones:
        target_occ = int(phase["zone_targets"].get(zone["zone_id"], 0.5) * zone["capacity"])
        zone["base"] = _lerp_toward(zone["base"], target_occ, zone["capacity"])
        zones_payload.append({"zoneId": zone["zone_id"], "occupancy": zone["base"]})
    
    for gate in gates:
        base_queue = gate.get("queue", 100)
        target_q = int(base_queue * phase["gate_queue_multiplier"] * random.uniform(0.7, 1.3))
        gate["queue"] = _lerp_toward(gate["queue"], target_q, 1000)
        gates_payload.append({"gateId": gate["gate_id"], "queue": gate["queue"], "isOpen": gate["is_open"]})
        
    return {"zones": zones_payload, "gates": gates_payload, "event_phase": phase["name"]}

def simulation_loop(app):
    """Background loop that executes tick every X seconds."""
    # Grace period to ensure GThread workers and SocketIO are fully bound
    time.sleep(2)
    
    zones = [dict(z) for z in ZONES_META]
    gates = [dict(g) for g in GATES_META]
    tick_count = 0
    
    print("[OK] Background Simulation Loop (Dynamic Phase Engine) Started")
    
    with app.app_context():
        try:
            from services.alert_service import push_alert
            push_alert(
                level="info", 
                category="system", 
                title="📡 Intelligence Feed Active", 
                message="VenueFlow operational signals are now broadcasting live via Redis Broker.",
                force_immediate=True
            )
            push_alert(
                level="info", 
                category="system", 
                title="🛡️ Security Systems Online", 
                message="Sensors initialized. Alerts are now cross-process persistent.",
                force_immediate=True
            )
        except Exception as e:
            print(f"[SIM ERR] Failed to push startup alerts: {e}")

    while True:
        with app.app_context():
            try:
                from services.alert_service import push_alert
                
                # ── HEARTBEAT ALERTS ──
                # Every tick (30s), push a heartbeat status check message
                if tick_count >= 0:
                    heartbeats = [
                        "Probing North Stand density sensors...",
                        "Syncing East Gate throughput metrics...",
                        "Calculating optimal egress paths...",
                        "Refreshing concession queue telemetry...",
                        "Monitoring stadium perimeter status..."
                    ]
                    push_alert(
                        level="info",
                        category="system",
                        title="🔍 Operational Scan (Live)",
                        message=random.choice(heartbeats)
                    )

                payload = generate_payload(zones, gates, tick_count)
                process_tick_data(payload)
                tick_count += 1
            except Exception as e:
                print(f"[SIM ERR] Failed to process background tick: {e}")
        
        time.sleep(INTERVAL_SEC)

def start_simulation(app):
    """Starts the simulation loop in a background thread."""
    thread = threading.Thread(target=simulation_loop, args=(app,), daemon=True)
    thread.start()
