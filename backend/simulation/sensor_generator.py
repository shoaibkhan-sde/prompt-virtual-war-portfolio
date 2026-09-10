"""
VenueFlow AI — Synthetic Sensor Data Generator
Produces MQTT-style JSON payloads simulating crowd density sensors.

Usage
─────
    python -m backend.simulation.sensor_generator           # continuous
    python -m backend.simulation.sensor_generator --once    # single batch
    python -m backend.simulation.sensor_generator --event   # event mode (surges)

Modes
─────
  default  : Gentle ±8% random walk — baseline crowd.
  --event  : Cycles through realistic venue events:
               PHASE 0  Pre-match arrival surge  (45 ticks)
               PHASE 1  Match in progress        (30 ticks, stable)
               PHASE 2  Half-time RUSH            (20 ticks, food courts spike)
               PHASE 3  Second half               (30 ticks, stable)
               PHASE 4  Post-match exodus         (25 ticks, gates surge, zones drop)
               PHASE 5  Venue clearing            (20 ticks, everything drains)
"""

import json
import random
import sys
import time
import requests
from datetime import datetime, timezone

# ── Zone definitions (mirrors routes_crowd.py) ──────────────
ZONES = [
    {"zone_id": "north-stand",       "name": "North Stand",      "capacity": 25000, "base": 18200},
    {"zone_id": "south-stand",       "name": "South Stand",      "capacity": 25000, "base": 12400},
    {"zone_id": "east-wing",         "name": "East Stand",        "capacity": 20000, "base": 19500},
    {"zone_id": "west-wing",         "name": "West Stand",        "capacity": 20000, "base": 8700},
    {"zone_id": "food-court-north",  "name": "North Food Hub",    "capacity": 5000,  "base": 3200},
    {"zone_id": "food-court-south",  "name": "South Food Hub",    "capacity": 5000,  "base": 1100},
    {"zone_id": "vip-lounge",        "name": "VIP Lounge",       "capacity": 2000,  "base": 850},
    {"zone_id": "parking-a",         "name": "Parking (Zone A)",    "capacity": 3000,  "base": 2100},
]

GATES = [
    {"gate_id": "gate-n1",  "queue": 120, "is_open": True},
    {"gate_id": "gate-n2",  "queue": 85,  "is_open": True},
    {"gate_id": "gate-s1",  "queue": 200, "is_open": True},
    {"gate_id": "gate-s2",  "queue": 45,  "is_open": True},
    {"gate_id": "gate-e1",  "queue": 310, "is_open": True},
    {"gate_id": "gate-w1",  "queue": 60,  "is_open": True},
    {"gate_id": "gate-vip", "queue": 10,  "is_open": True},
]

JITTER_PCT   = 0.08   # ±8% random walk per tick
INTERVAL_SEC = 30.0    # seconds between ticks

# ── Event mode phase config ──────────────────────────────────
EVENT_PHASES = [
    # (name, ticks, zone multipliers per zone_id, gate queue ranges)
    {
        "name": "🏟️  Pre-match Arrival Surge",
        "ticks": 45,
        "zone_targets": {
            "north-stand": 0.85, "south-stand": 0.70, "east-wing": 0.80,
            "west-wing": 0.50,   "food-court-north": 0.55, "food-court-south": 0.30,
            "vip-lounge": 0.60,  "parking-a": 0.85,
        },
        "gate_queue_ranges": {
            "gate-n1": (150, 350), "gate-n2": (100, 250), "gate-s1": (180, 400),
            "gate-s2": (80, 200),  "gate-e1": (300, 600), "gate-w1": (80, 200),
            "gate-vip": (5, 20),
        },
    },
    {
        "name": "⚽  Match In Progress",
        "ticks": 30,
        "zone_targets": {
            "north-stand": 0.95, "south-stand": 0.88, "east-wing": 0.97,
            "west-wing": 0.55,   "food-court-north": 0.25, "food-court-south": 0.15,
            "vip-lounge": 0.80,  "parking-a": 0.95,
        },
        "gate_queue_ranges": {
            "gate-n1": (5, 20), "gate-n2": (5, 15), "gate-s1": (5, 20),
            "gate-s2": (3, 10), "gate-e1": (5, 15), "gate-w1": (3, 10),
            "gate-vip": (0, 5),
        },
    },
    {
        "name": "🍟  Half-time RUSH",
        "ticks": 20,
        "zone_targets": {
            "north-stand": 0.45, "south-stand": 0.40, "east-wing": 0.50,
            "west-wing": 0.45,   "food-court-north": 0.99, "food-court-south": 0.97,
            "vip-lounge": 0.90,  "parking-a": 0.95,
        },
        "gate_queue_ranges": {
            "gate-n1": (30, 80), "gate-n2": (25, 70), "gate-s1": (40, 100),
            "gate-s2": (20, 60), "gate-e1": (20, 60), "gate-w1": (15, 50),
            "gate-vip": (2, 10),
        },
    },
    {
        "name": "⚽  Second Half",
        "ticks": 30,
        "zone_targets": {
            "north-stand": 0.92, "south-stand": 0.85, "east-wing": 0.95,
            "west-wing": 0.52,   "food-court-north": 0.35, "food-court-south": 0.20,
            "vip-lounge": 0.75,  "parking-a": 0.93,
        },
        "gate_queue_ranges": {
            "gate-n1": (5, 20), "gate-n2": (5, 15), "gate-s1": (5, 20),
            "gate-s2": (3, 10), "gate-e1": (5, 15), "gate-w1": (3, 10),
            "gate-vip": (0, 5),
        },
    },
    {
        "name": "🚨  Critical Phase (85th Minute)",
        "ticks": 15,
        "zone_targets": {
            "north-stand": 0.90, "south-stand": 0.80, "east-wing": 0.90,
            "west-wing": 0.50,   "food-court-north": 0.30, "food-court-south": 0.15,
            "vip-lounge": 0.50,  "parking-a": 0.95,
        },
        "gate_queue_ranges": {
            "gate-n1": (250, 450), "gate-n2": (200, 350), "gate-s1": (350, 600),
            "gate-s2": (100, 250), "gate-e1": (300, 500), "gate-w1": (120, 250),
            "gate-vip": (5, 15),
        },
    },
    {
        "name": "🚶  Post-match Exodus",
        "ticks": 25,
        "zone_targets": {
            "north-stand": 0.60, "south-stand": 0.55, "east-wing": 0.65,
            "west-wing": 0.40,   "food-court-north": 0.50, "food-court-south": 0.40,
            "vip-lounge": 0.30,  "parking-a": 0.70,
        },
        "gate_queue_ranges": {
            "gate-n1": (200, 500), "gate-n2": (180, 450), "gate-s1": (300, 700),
            "gate-s2": (150, 400), "gate-e1": (400, 800), "gate-w1": (150, 350),
            "gate-vip": (10, 30),
        },
    },
    {
        "name": "🌙  Venue Clearing",
        "ticks": 20,
        "zone_targets": {
            "north-stand": 0.10, "south-stand": 0.08, "east-wing": 0.12,
            "west-wing": 0.15,   "food-court-north": 0.20, "food-court-south": 0.15,
            "vip-lounge": 0.05,  "parking-a": 0.30,
        },
        "gate_queue_ranges": {
            "gate-n1": (10, 50), "gate-n2": (10, 40), "gate-s1": (15, 60),
            "gate-s2": (5, 30),  "gate-e1": (20, 70), "gate-w1": (5, 25),
            "gate-vip": (0, 5),
        },
    },
]


def _jitter(value: int, capacity: int) -> int:
    """Random-walk a value by ±JITTER_PCT, clamped to [0, capacity]."""
    if value == 0:
        value = 10
    delta = int(value * JITTER_PCT * random.uniform(-1, 1.2))
    if delta == 0:
        delta = random.choice([-1, 1])
    return max(0, min(value + delta, capacity))


def _lerp_toward(current: int, target: int, capacity: int, speed: float = 0.15) -> int:
    """Gradually move current toward target occupancy (lerp + jitter)."""
    diff = target - current
    step = int(diff * speed) + random.randint(-int(capacity * 0.01), int(capacity * 0.01))
    return max(0, min(current + step, capacity))


def generate_tick_default(zones: list, gates: list) -> dict:
    """Default mode: gentle random walk."""
    zones_payload, gates_payload = [], []
    for zone in zones:
        zone["base"] = _jitter(zone["base"], zone["capacity"])
        zones_payload.append({"zoneId": zone["zone_id"], "occupancy": zone["base"]})
    for gate in gates:
        gate["queue"] = _jitter(gate["queue"], 1000)
        gates_payload.append({"gateId": gate["gate_id"], "queue": gate["queue"], "isOpen": gate["is_open"]})
    return {"zones": zones_payload, "gates": gates_payload, "event_phase": "Normal"}


def generate_tick_event(zones: list, gates: list, phase: dict) -> dict:
    """Event mode: lerp toward phase targets."""
    zones_payload, gates_payload = [], []
    zone_targets = phase["zone_targets"]
    gate_ranges  = phase["gate_queue_ranges"]

    for zone in zones:
        target_occ = int(zone_targets.get(zone["zone_id"], 0.5) * zone["capacity"])
        zone["base"] = _lerp_toward(zone["base"], target_occ, zone["capacity"])
        zones_payload.append({"zoneId": zone["zone_id"], "occupancy": zone["base"]})

    for gate in gates:
        lo, hi = gate_ranges.get(gate["gate_id"], (30, 150))
        target_q = random.randint(lo, hi)
        gate["queue"] = _lerp_toward(gate["queue"], target_q, 1000)
        gates_payload.append({"gateId": gate["gate_id"], "queue": gate["queue"], "isOpen": gate.get("is_open", True)})

    return {"zones": zones_payload, "gates": gates_payload, "event_phase": phase["name"]}


def _get_auth_token(retries=5, delay=2) -> str:
    """Fetch JWT token from local auth endpoint with retries."""
    for i in range(retries):
        try:
            # Register a mock user first so the DB is populated
            requests.post("http://localhost:5000/api/auth/register", json={
                "username": "sensor_bot",
                "password": "password"
            }, timeout=2)
            
            # Login to get JWT
            res = requests.post("http://localhost:5000/api/auth/login", json={
                "username": "sensor_bot",
                "password": "password"
            }, timeout=2)
            if res.status_code == 200:
                token = res.json().get("token")
                if token:
                    return token
        except Exception as e:
            pass
        
        print(f"[RETRY] Auth failed, trial {i+1}/{retries} in {delay}s...")
        time.sleep(delay)
    
    print("[ERR] Could not acquire auth token after retries.")
    return ""

def main():
    once      = "--once"  in sys.argv
    event_mode = "--event" in sys.argv

    print("[OK] VenueFlow Sensor Simulator started")
    print(f"   Zones : {len(ZONES)}")
    print(f"   Gates : {len(GATES)}")
    print(f"   Mode  : {'event-cycle' if event_mode else ('single-tick' if once else f'continuous ({INTERVAL_SEC}s)')}")
    print()

    zones = [dict(z) for z in ZONES]
    gates = [dict(g) for g in GATES]
    token = _get_auth_token()
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    if event_mode:
        for phase in EVENT_PHASES:
            print(f"\n{'='*50}")
            print(f"  PHASE: {phase['name']}  ({phase['ticks']} ticks)")
            print(f"{'='*50}")
            for tick_num in range(phase["ticks"]):
                payload = generate_tick_event(zones, gates, phase)
                try:
                    res = requests.post("http://localhost:5000/api/internal/tick", json=payload, headers=headers, timeout=2)
                    print(f"  [{tick_num+1:02d}/{phase['ticks']}] 📡 Tick sent → {res.status_code}")
                except Exception as e:
                    print(f"  ⚠️ Failed: {e}")
                time.sleep(INTERVAL_SEC)
        print("\n✅ Event cycle complete.")
    else:
        tick = 0
        while True:
            payload = generate_tick_default(zones, gates)
            try:
                res = requests.post("http://localhost:5000/api/internal/tick", json=payload, headers=headers, timeout=2)
                tick += 1
                print(f"[TICK] #{tick}: {len(payload['zones'])} zones, {len(payload['gates'])} gates -> {res.status_code}")
            except Exception as e:
                print(f"[ERR] Failed to send tick: {e}")
            if once:
                break
            time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()
