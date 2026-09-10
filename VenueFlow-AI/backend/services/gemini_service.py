"""
VenueFlow AI — Gemini Intelligence Service
==========================================
Version  : 3.0.0  (Advanced System Prompt Implementation)
Author   : VenueFlow Engineering
Coverage : Full venue concierge AI — navigation, crowd intelligence,
           emergency management, event-phase awareness, proactive
           suggestions, Gemini LLM fallback with rich context injection.

Architecture
------------
chat()
 ├─ Phase 0 : Emergency / safety intercept          (highest priority)
 ├─ Phase 1 : Context-redirect handling             (dashboard clicks)
 ├─ Phase 2 : Intent routing → structured response  (all known keywords)
 ├─ Phase 3 : Gemini LLM with rich context          (open-ended questions)
 └─ Phase 4 : Fallback                              (Gemini unavailable)

Intent Layers (ordered by specificity, deep-to-shallow)
---------------------------------------------------------
Emergency  → medical / fire / evacuation / fight / suspicious
Safety     → alert / warning / danger
VIP        → lounge / premium / vip / hospitality
Charging   → charge / power / battery / plug
Family     → family / kid / child / stroller / baby
Merch      → merchandise / shop / store / jersey / souvenir
Smoking    → smoking / smoke / cigarette / vape
Schedule   → schedule / timing / kickoff / halftime / match time
Restroom   → washroom / toilet / bathroom
Food       → hungry / food / eat / snack …
  ├─ Menu  → menu / price / items
  ├─ Wait  → queue / wait time / crowd level
  └─ Dirs  → directions / where is / navigate
Gate       → gate / exit / entry / door
  ├─ Walk  → walking time / distance
  └─ Parkng→ parking / car park / lot
Map        → map / layout / floor plan / venue
Greeting   → hi / hello / hey
"""

from __future__ import annotations

import re
import time
import logging
from typing import Any, Dict, List, Optional, Tuple

from config import Config
from services.redis_service import get_all_zones, get_all_gates
from services.maps_service import distances_to_gates, haversine

logger = logging.getLogger("venueflow.ai")

# ═══════════════════════════════════════════════════════════════════════════════
#  CONSTANTS & CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Gemini model override (may be set via Config.GEMINI_MODEL)
_DEFAULT_MODEL = "gemini-1.5-flash"

# Crowd density thresholds
DENSITY_LOW      = 0.40   # ≤ 40% → green
DENSITY_MODERATE = 0.65   # 41-65% → yellow
DENSITY_HIGH     = 0.80   # 66-80% → orange
# > 80% → red / critical

# Walking speed: average 70 metres / minute at venue
WALK_SPEED_MPM = 70

# Aesthetic delay for AI "thinking" time in seconds
CHAT_MIN_DELAY = 1.6

# Static locations for fallback / distance-less queries
# (Mapped to approximate coordinates for dynamic Distance Matrix lookup)
VENUE_COORDINATES: Dict[str, Tuple[float, float]] = {
    "gate_1": (12.9716, 77.5946), # Example coordinates
    "gate_2": (12.9720, 77.5950),
    "gate_3": (12.9730, 77.5960),
    "gate_4": (12.9740, 77.5970),
    # ... more added dynamically
}


def _walk_time(distance_m: int) -> str:
    """Return human-readable walk time for a given distance in metres."""
    mins = max(1, round(distance_m / WALK_SPEED_MPM))
    return f"~{mins} min" if mins < 10 else f"~{mins} mins"


# ═══════════════════════════════════════════════════════════════════════════════
#  ADVANCED SYSTEM PROMPT  (Gemini LLM context)
# ═══════════════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are **VenueFlow AI**, a premium AI concierge and operational intelligence \
assistant embedded inside a real-time sports venue and event management platform.

Your role combines:
• Elite customer support agent
• Stadium operations manager
• Crowd flow analyst
• Navigation guide
• Hospitality concierge
• Safety officer
• Real-time venue intelligence engine

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You answer questions about:
1. Venue navigation — gates, zones, seating, food hubs, restrooms, parking,
   VIP lounges, emergency exits, medical points, charging stations,
   merchandise stores, family areas, smoking zones, escalators / elevators.
2. Crowd intelligence — fastest gate, shortest food queue, least-crowded
   restroom, safest/fastest route, walking times, crowd surges, parking exits.
3. Real-time operations — entry/exit delays, queue length, zone occupancy,
   incident alerts, closures, security alerts, event schedule, weather impact.
4. Conversational support — natural language, incomplete questions,
   inferred intent, spelling tolerance, button-based and free-form inputs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Professional but friendly, confident but never robotic.
• Reassuring during crowded or emergency situations.
• Slightly energetic for event atmosphere.
• NEVER: long paragraphs, generic AI phrases, "I am just an AI", repetition.
• PREFERRED: direct answer first → best recommendation → one-sentence why →
  next-step suggestion → 2-4 follow-up button options.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Acknowledge the request.
2. Give the best recommendation first.
3. Mention the supporting real-time insight.
4. Suggest the next action.
5. Offer 2–4 relevant follow-up options.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTELLIGENCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Priority order: lowest crowd → shortest wait → fastest route → safety → convenience.
When multiple options exist: rank best-to-worst, explain briefly, mention tradeoffs.
If data is missing: be honest, give best fallback, never fabricate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGENCY BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Emergency / injury / fire / evacuation / missing person / fight / suspicious activity:
→ Switch to calm, direct tone.
→ Immediate action steps first.
→ Nearest help point / security / medical / emergency exit.
→ Avoid unnecessary detail.
→ User safety over convenience — always.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Never fabricate live data.
• Never recommend crowded/unsafe areas unless unavoidable.
• Never give vague directions.
• Keep answers under 4 sentences unless listing items.
• Use bullet points when useful.
• Prefer practical guidance over explanation.
"""

# ═══════════════════════════════════════════════════════════════════════════════
#  GEMINI CLIENT — LAZY SINGLETON
# ═══════════════════════════════════════════════════════════════════════════════

_client = None


def _get_client():
    """Lazy-load the Gemini client once; return None if SDK unavailable."""
    global _client
    if _client is None:
        try:
            from google import genai                           # type: ignore
            _client = genai.Client(api_key=Config.GEMINI_API_KEY)
            logger.info("Gemini client initialised successfully.")
        except ImportError:
            logger.warning("google-genai SDK not installed — LLM disabled.")
            return None
        except Exception as exc:
            logger.error("Gemini client init failed: %s", exc)
            return None
    return _client


# ═══════════════════════════════════════════════════════════════════════════════
#  KEYWORD INTENT GROUPS  (all in one registry for easy maintenance)
# ═══════════════════════════════════════════════════════════════════════════════

INTENT_KEYWORDS: Dict[str, List[str]] = {
    # ── Priority 0 — Safety / Emergency ─────────────────────────────────────
    "emergency": [  # noqa: E501
        "emergency", "help", "ambulance", "fire", "evacuate", "evacuation",
        "injured", "injury", "hurt", "accident", "collapse", "unconscious",
        "heart attack", "faint", "fainted", "bleeding", "blood", "attack",
        "bomb", "threat", "dangerous", "danger", "panic", "stampede",
        "missing person", "missing child", "lost child", "kidnap",
    ],
    "fight": [
        "fight", "fighting", "brawl", "violence", "assault", "punch",
        "aggressive", "aggression", "altercation", "trouble",
    ],
    "suspicious": [
        "suspicious", "unattended bag", "unattended luggage",
        "suspect", "report", "threat",
    ],
    "fire": [
        "fire", "smoke", "flames", "burning", "blaze", "alarm",
        "fire exit", "fire alarm",
    ],

    # ── Priority 1 — Medical ─────────────────────────────────────────────────
    "medical": [
        "medical", "doctor", "nurse", "first aid", "first-aid",
        "medic", "paramedic", "hospital", "sick", "ill", "vomit",
        "chest pain", "breathe", "breathing", "allergic", "allergy",
        "medicine", "medication", "wheelchair", "disabled",
        "accessibility", "accessible",
    ],

    # ── Priority 2 — Security ────────────────────────────────────────────────
    "security": [
        "security", "police", "cop", "officer", "guard", "staff",
        "lost item", "lost phone", "lost wallet", "lost bag",
        "stolen", "theft", "pickpocket",
    ],

    # ── Priority 3 — VIP / Premium ───────────────────────────────────────────
    "vip": [
        "vip", "lounge", "premium", "hospitality", "corporate",
        "executive", "private", "suite", "box seat", "vip lounge",
        "vip entrance", "vip area",
    ],

    # ── Priority 4 — Charging / Power ────────────────────────────────────────
    "charging": [
        "charge", "charging", "charger", "power", "battery",
        "plug", "socket", "outlet", "usb", "power bank",
        "my phone is dead", "phone dead", "low battery",
    ],

    # ── Priority 5 — Family / Kids ───────────────────────────────────────────
    "family": [
        "family", "kid", "kids", "child", "children", "toddler",
        "baby", "infant", "stroller", "pram", "buggy",
        "family zone", "family area", "family section",
        "nursing room", "baby changing", "changing room",
    ],

    # ── Priority 6 — Merchandise ─────────────────────────────────────────────
    "merchandise": [
        "merchandise", "merch", "shop", "store", "jersey",
        "souvenir", "souvenir store", "gift", "hat", "scarf",
        "buy", "purchase", "team store", "fan store",
    ],

    # ── Priority 7 — Smoking ─────────────────────────────────────────────────
    "smoking": [
        "smoking", "smoke", "cigarette", "vape", "vaping",
        "smoking zone", "smoking area", "designated smoking",
        "lighter", "tobacco",
    ],

    # ── Priority 8 — Event Schedule ──────────────────────────────────────────
    "schedule": [
        "schedule", "timing", "kickoff", "kick off", "kick-off",
        "halftime", "half time", "half-time", "start time",
        "when does", "what time", "match time", "event time",
        "full time", "lineup", "line up", "player", "players",
        "formation", "squad",
    ],

    # ── Priority 9 — WiFi / Connectivity ────────────────────────────────────
    "wifi": [
        "wifi", "wi-fi", "internet", "network", "hotspot",
        "password", "connect", "connection", "signal",
        "streaming", "stream",
    ],

    # ── Priority 10 — Weather ────────────────────────────────────────────────
    "weather": [
        "weather", "rain", "raining", "umbrella", "cold", "hot",
        "temperature", "wind", "cloudy", "sun", "sunny",
        "forecast", "shelter", "covered",
    ],

    # ── Food sub-intents (checked before general food) ───────────────────────
    "menu": [
        "menu", "menus", "view menu", "what's available",
        "items", "order", "price", "prices", "cost", "how much",
        "what food", "what do they serve",
    ],
    "wait": [
        "wait", "waits", "wait time", "queue", "queues",
        "how long", "busy", "crowd", "crowds", "line", "lines",
        "crowd level", "crowd density", "congestion", "packed",
    ],
    "directions": [
        "directions", "direction", "how to get", "where is",
        "take me", "navigate", "get there", "path to",
        "way to", "route", "routes", "lead me", "guide me",
        "how do i reach", "show me the way",
    ],

    # ── Gate sub-intents ─────────────────────────────────────────────────────
    "walking": [
        "walking", "walk", "on foot", "walking time",
        "distance", "how far", "how close", "minutes away",
    ],

    # ── ATM / Cash ───────────────────────────────────────────────────────────
    "atm": [
        "atm", "cash", "money", "withdraw", "bank", "teller",
        "cash machine", "cashpoint", "do you have an atm",
        "where is the atm",
    ],

    # ── Accessibility / Mobility ──────────────────────────────────────────────
    "accessibility": [
        "accessibility", "accessible", "wheelchair", "mobility",
        "elevator", "lift", "ramp", "escalator",
        "differently abled", "special needs",
        "hearing loop", "hearing impaired", "visually impaired",
    ],

    # ── Info Desk / Lost & Found ──────────────────────────────────────────────
    "info_desk": [
        "info", "information desk", "info desk",
        "lost and found", "lost & found",
        "customer service", "help desk", "enquiry",
    ],

    # ── Top-level intents ────────────────────────────────────────────────────
    "greeting": [
        "hi", "hello", "hey", "greet", "yo", "howdy", "sup",
        "start", "welcome", "good morning", "good afternoon",
        "good evening", "namaste", "what can you do",
        "help me", "assist me",
    ],
    "map": [
        "map", "maps", "entry map", "venue map", "layout",
        "floor plan", "where", "location", "find", "section",
        "seat", "seats", "overview", "guide me around",
    ],
    "parking": [
        "parking", "park", "car park", "lot", "lots",
        "vehicle", "cars", "my car", "where to park",
        "parking spot", "parked",
    ],
    "restroom": [
        "restroom", "restrooms", "bathroom", "bathrooms",
        "toilet", "toilets", "washroom", "washrooms",
        "loo", "wc", "lavatory", "powder room",
    ],
    "food": [
        "hungry", "food", "foods", "eat", "snack", "snacks",
        "lunch", "dinner", "breakfast", "restaurant",
        "restaurants", "burger", "burgers", "drink", "drinks",
        "beverage", "beverages", "court", "cafe", "coffee",
        "tea", "pizza", "hotdog", "nachos", "fries",
    ],
    "gate": [
        "gate", "gates", "exit", "exits", "entry", "entries",
        "door", "doors", "way out", "leave", "entrance",
        "entrances", "best gate", "find gate", "which gate",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
#  UTILITY — KEYWORD MATCHING
# ═══════════════════════════════════════════════════════════════════════════════

def _check_intent(msg: str, keywords: List[str]) -> bool:
    """
    Word-boundary-safe keyword match.
    Strips emojis / punctuation, lowercases, then checks whole-word patterns.
    Multi-word keywords are matched as literal substrings (not word-boundary split).
    """
    clean = re.sub(r"[^\w\s']", " ", msg).lower()
    for kw in keywords:
        if " " in kw:                          # multi-word phrase
            if kw in clean:
                return True
        else:
            if re.search(rf"\b{re.escape(kw)}\b", clean):
                return True
    return False


def _matches_any_known_intent(user_message: str) -> bool:
    """True if the message matches ANY keyword group."""
    return any(
        _check_intent(user_message, kws)
        for kws in INTENT_KEYWORDS.values()
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  VENUE INTELLIGENCE HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _density_emoji(density: float) -> str:
    """Return traffic-light emoji for a density float 0–1."""
    if density <= DENSITY_LOW:
        return "🟢"
    if density <= DENSITY_MODERATE:
        return "🟡"
    if density <= DENSITY_HIGH:
        return "🟠"
    return "🔴"


def _density_label(density: float) -> str:
    """Return human label for density."""
    if density <= DENSITY_LOW:
        return "Low crowd"
    if density <= DENSITY_MODERATE:
        return "Moderate"
    if density <= DENSITY_HIGH:
        return "Busy"
    return "Critical — avoid if possible"


def _get_safety_footnote(zones) -> str:
    """Append a critical-zone warning note if any zone is at critical density."""
    critical = [z for z in zones if getattr(z, "status", "") == "critical"
                or getattr(z, "density", 0) > DENSITY_HIGH]
    if critical:
        names = ", ".join(z.name for z in critical[:2])
        return f"\n\n⚠️ **Active Alert:** {names} — follow staff guidance and green markers."
    return ""


def _rank_gates(gates) -> List[Any]:
    """Return gates sorted by density ascending (least crowded first)."""
    return sorted(gates, key=lambda g: getattr(g, "density", 0.5))


def _rank_zones_by_density(zones, zone_id_prefix: str) -> List[Any]:
    """Filter zones by ID prefix and sort by density ascending."""
    filtered = [z for z in zones if z.zone_id.startswith(zone_id_prefix)]
    return sorted(filtered, key=lambda z: getattr(z, "density", 0.5))


def _get_best_food_court(zones) -> Tuple[Optional[Any], Optional[Any]]:
    """Return (best_zone, worst_zone) for food courts."""
    food_zones = [z for z in zones if "food" in z.zone_id.lower()]
    if not food_zones:
        return None, None
    ranked = sorted(food_zones, key=lambda z: getattr(z, "density", 0.5))
    best  = ranked[0]
    worst = ranked[-1] if len(ranked) > 1 else None
    return best, worst


def _estimate_wait_time(density: float) -> str:
    """Estimate food queue wait time from density."""
    if density <= DENSITY_LOW:
        return "~2 min"
    if density <= DENSITY_MODERATE:
        return "~5 min"
    if density <= DENSITY_HIGH:
        return "~10 min"
    return "~15+ min"


def _gate_status_line(gate) -> str:
    """Return a single formatted gate status line."""
    d = getattr(gate, "density", 0.5)
    emoji = _density_emoji(d)
    name  = getattr(gate, "name", "Gate")
    pct   = round(d * 100)
    label = _density_label(d)
    return f"• {emoji} **{name}** — {pct}% utilised · {label}"


def _build_live_context(zones, gates) -> str:
    """
    Build a rich, structured real-time context string to inject into
    the Gemini prompt. Gives the LLM full situational awareness.
    """
    lines = ["=== LIVE VENUE CONTEXT ===\n"]

    lines.append("📊 GATE STATUS:")
    for g in _rank_gates(gates):
        d   = getattr(g, "density", 0.5)
        wt  = getattr(g, "wait_time", _estimate_wait_time(d))
        lines.append(
            f"  • {g.name}: {round(d*100)}% — {_density_label(d)} — wait {wt}"
        )

    lines.append("\n🏟️ ZONE OCCUPANCY:")
    for z in zones:
        d = getattr(z, "density", 0.5)
        lines.append(
            f"  • {z.name} ({z.zone_id}): {round(d*100)}% — {_density_label(d)}"
        )

    best_food, worst_food = _get_best_food_court(zones)
    if best_food:
        lines.append(
            f"\n🍔 BEST FOOD OPTION: {best_food.name} "
            f"({round(best_food.density*100)}% — wait {_estimate_wait_time(best_food.density)})"
        )

    ranked_gates = _rank_gates(gates)
    if ranked_gates:
        lines.append(f"🚪 FASTEST GATE: {ranked_gates[0].name}")
        if len(ranked_gates) > 1:
            lines.append(f"🚫 AVOID GATE: {ranked_gates[-1].name} (most crowded)")

    critical_zones = [z for z in zones if getattr(z, "density", 0) > DENSITY_HIGH]
    if critical_zones:
        lines.append(
            f"\n🚨 CRITICAL ZONES: "
            + ", ".join(z.name for z in critical_zones)
        )

    lines.append("=== END CONTEXT ===")
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
#  PROACTIVE SUGGESTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def _get_proactive_tip(zones, gates) -> str:
    """
    Generate one smart, proactive tip based on live conditions.
    Returns empty string if nothing noteworthy to surface.
    """
    ranked_gates = _rank_gates(gates)
    best_food, _ = _get_best_food_court(zones)

    tips = []

    # Gate tip
    if len(ranked_gates) >= 2:
        fast = ranked_gates[0]
        slow = ranked_gates[-1]
        fast_d = getattr(fast, "density", 0)
        slow_d = getattr(slow, "density", 0)
        if slow_d - fast_d > 0.30:
            saved = round((slow_d - fast_d) * 15)  # rough minute estimate
            tips.append(
                f"💡 **Smart Tip:** {fast.name} vs {slow.name} — "
                f"switching now saves ~{saved} minutes in queue."
            )

    # Food tip
    if best_food and getattr(best_food, "density", 1) < DENSITY_MODERATE:
        tips.append(
            f"💡 **Smart Tip:** {best_food.name} is quiet right now — "
            "great window to grab food before the halftime rush."
        )

    # Critical zone warning
    critical = [z for z in zones if getattr(z, "density", 0) > DENSITY_HIGH]
    if critical:
        tips.append(
            f"💡 **Crowd Alert:** {critical[0].name} is at critical load — "
            "avoid if possible and use alternate routes."
        )

    return "\n" + tips[0] if tips else ""


# ═══════════════════════════════════════════════════════════════════════════════
#  INTENT RESPONSE BUILDERS
#  Each function returns a {"text": str, "options": list[str]} dict.
# ═══════════════════════════════════════════════════════════════════════════════

# ── Emergency Responses ──────────────────────────────────────────────────────

def _resp_emergency(msg: str, zones, gates) -> Dict[str, Any]:
    """General emergency / medical / evacuation handler."""
    is_medical    = _check_intent(msg, INTENT_KEYWORDS["medical"])
    is_fire       = _check_intent(msg, INTENT_KEYWORDS["fire"])
    is_fight      = _check_intent(msg, INTENT_KEYWORDS["fight"])
    is_suspicious = _check_intent(msg, INTENT_KEYWORDS["suspicious"])

    # Fire / evacuation
    if is_fire:
        return {
            "text": (
                "🔥 **FIRE ALERT PROTOCOL ACTIVATED**\n\n"
                "**Immediate actions:**\n"
                "1️⃣  Do NOT use elevators — use the nearest staircase.\n"
                "2️⃣  Proceed calmly to the closest emergency exit (marked in red).\n"
                "3️⃣  Emergency exits: **North Gate 2 · South Gate 4 · West Passage**\n"
                "4️⃣  Fire wardens in orange vests are guiding evacuation now.\n"
                "5️⃣  Assembly point: **Car Park Zone A — north side**.\n\n"
                "📞 Venue Emergency Line: **1800-VFL-SAFE**"
            ),
            "options": ["📍 Nearest Exit", "🏥 Medical Bay", "🛡️ Security Desk"]
        }

    # Medical emergency
    if is_medical:
        # Dynamic lookup for medical bay
        med_coords = VENUE_COORDINATES.get("medical_bay", (12.9716, 77.5946))
        # Note: In a real app, we'd get user_coords from context
        dist_m = 160 # Fallback
        return {
            "text": (
                "🏥 **Medical Assistance — Immediate Help**\n\n"
                "**Nearest Medical Bay:** Level 1 · Section B corridor — "
                f"{_walk_time(dist_m)} from your area.\n\n"
                "**Actions:**\n"
                "1️⃣  Call venue emergency: **1800-VFL-SAFE** (toll-free).\n"
                "2️⃣  Approach any staff member wearing a **blue vest** — "
                "all carry first-aid kits.\n"
                "3️⃣  AED defibrillators are located at every gate entrance.\n"
                "4️⃣  Wheelchair access available via Gate 3 (flat route, no stairs).\n\n"
                "A medical team will reach you within **90 seconds** of being called."
            ),
            "options": ["📍 Medical Bay Map", "🛡️ Security Desk", "🚪 Nearest Gate"]
        }

    # Fight / violence
    if is_fight:
        return {
            "text": (
                "🛡️ **Security Alert — Do Not Intervene**\n\n"
                "**Immediate steps:**\n"
                "1️⃣  Move away from the area calmly and quickly.\n"
                "2️⃣  Alert the nearest staff member (yellow vest).\n"
                "3️⃣  Security control: **Gate 3 Security Desk** — "
                f"{_walk_time(410)} walk.\n"
                "4️⃣  Emergency text line: SMS **HELP** to **56789**.\n\n"
                "Our security team is being dispatched right now."
            ),
            "options": ["🛡️ Security Desk Location", "🏥 Medical Bay", "🚪 Nearest Exit"]
        }

    # Suspicious activity
    if is_suspicious:
        return {
            "text": (
                "⚠️ **Suspicious Activity — Report Protocol**\n\n"
                "**Do NOT touch or approach the item or individual.**\n\n"
                "1️⃣  Note the exact location and describe what you see.\n"
                "2️⃣  Inform the nearest staff member immediately.\n"
                "3️⃣  Call venue security: **1800-VFL-SAFE**.\n"
                "4️⃣  SMS **REPORT** to **56789** with your location.\n\n"
                "Security has been notified. Please move to an open area and stay calm."
            ),
            "options": ["🛡️ Security Desk", "🚪 Nearest Exit", "🏥 Medical Bay"]
        }

    # Generic emergency
    return {
        "text": (
            "🚨 **Emergency Protocol**\n\n"
            "**Immediate contacts:**\n"
            "• 🏥 Medical Bay — Level 1, Section B\n"
            "• 🛡️ Security Desk — Gate 3 entrance\n"
            "• 📞 Emergency Line: **1800-VFL-SAFE** (toll-free, 24/7)\n"
            "• 📱 SMS: text **HELP** to **56789**\n\n"
            "Staff in **orange vests** are emergency-trained. "
            "Please stay calm and follow their instructions."
        ),
        "options": ["🏥 Medical Bay", "🛡️ Security Desk", "🚪 Emergency Exit"]
    }


# ── Security Response ────────────────────────────────────────────────────────

def _resp_security(zones, gates) -> Dict[str, Any]:
    return {
        "text": (
            "🛡️ **Security & Lost Items**\n\n"
            "• **Security Desk:** Gate 3 entrance — Level 1 "
            f"({_walk_time(410)} from main stand)\n"
            "• **Lost & Found:** North concourse, beside Gate 2 kiosks\n"
            "• **Police Liaison:** on duty at Gate 1 (north side)\n"
            "• **Emergency line:** 1800-VFL-SAFE\n\n"
            "For lost items, also check with the Info Desk at Gate 5 "
            "— common drop-off point."
        ) + _get_safety_footnote(zones),
        "options": [
            "📞 Emergency Line", "🏥 Medical Bay",
            "🗺️ Venue Map", "🚪 Nearest Gate"
        ]
    }


# ── VIP Response ─────────────────────────────────────────────────────────────

def _resp_vip(zones, gates) -> Dict[str, Any]:
    tip = _get_proactive_tip(zones, gates)
    return {
        "text": (
            "⭐ **VIP & Premium Services**\n\n"
            "• **VIP Lounge:** North Stand, Level 3 — "
            f"{_walk_time(VENUE_DISTANCES['vip_lounge'])} from main gate\n"
            "• **VIP Entrance:** Dedicated lane at **Gate 7** — "
            "zero queue, priority access\n"
            "• **Hospitality Suites:** Levels 4–5, North Stand — "
            "access via private elevator at Gate 7\n"
            "• **Concierge Desk:** VIP Lounge, Level 3 — "
            "open 2 hrs before kickoff to full time\n"
            "• **Premium Dining:** Executive Club restaurant, Level 4\n\n"
            "Show your VIP pass at Gate 7 for seamless entry."
        ) + tip + _get_safety_footnote(zones),
        "options": [
            "🗺️ VIP Entrance Map", "🍽️ Executive Dining",
            "🚪 Gate 7 Status", "🅿️ VIP Parking"
        ]
    }


# ── Charging Response ────────────────────────────────────────────────────────

def _resp_charging(zones, gates) -> Dict[str, Any]:
    return {
        "text": (
            "🔋 **Phone Charging Stations**\n\n"
            "• ⚡ **East Charging Hub** (near Gate 5) — "
            f"{_walk_time(VENUE_DISTANCES['charging_station_e'])} · "
            "20 USB-A + 10 USB-C + 5 wireless pads · **Available**\n"
            "• ⚡ **West Charging Hub** (near Gate 6) — "
            f"{_walk_time(VENUE_DISTANCES['charging_station_w'])} · "
            "15 multi-cable units · **Available**\n"
            "• ⚡ **VIP Lounge** (Level 3) — premium charging bay, "
            "VIP pass required\n\n"
            "🔌 Cables for Lightning, USB-C, and Micro-USB are available at "
            "the Info Desk (Gate 5) for ₹50 deposit."
        ),
        "options": ["📍 East Hub Map", "📍 West Hub Map", "🗺️ Venue Map", "🚪 Gate 5"]
    }


# ── Family Response ──────────────────────────────────────────────────────────

def _resp_family(zones, gates) -> Dict[str, Any]:
    tip = _get_proactive_tip(zones, gates)
    return {
        "text": (
            "👨‍👩‍👧 **Family & Kids Zone**\n\n"
            "• 🎠 **Family Zone:** South Stand, Level 1\n"
            "• 🍼 **Baby Changing:** Restrooms on Level 1 (near Gate 3) & Level 2\n"
            "• 🤱 **Nursing Room:** Family Zone, South Stand — private & air-conditioned\n"
            "• 🧸 **Kids' Play Area:** Family Zone — supervised, free of charge\n"
            "• 👶 **Stroller Parking:** South Gate corridor — dedicated space\n"
            "• 🚻 **Accessible Restrooms:** Gates 3, 4, and 5 (ground level)\n\n"
            "The Family Zone entrance is stroller-friendly — no stairs!"
        ) + tip + _get_safety_footnote(zones),
        "options": [
            "📍 Family Zone Map", "🚽 Nearest Restroom",
            "🍔 Family-Friendly Food", "🚪 Gate 3 (Family Entry)"
        ]
    }


# ── Merchandise Response ─────────────────────────────────────────────────────

def _resp_merchandise(zones, gates) -> Dict[str, Any]:
    return {
        "text": (
            "🛍️ **Merchandise & Fan Stores**\n\n"
            "• 🏪 **South Fan Store** *(Main)* — Gate 4 concourse · Open now\n"
            "  Jerseys · Scarves · Caps · Keychains · Signed Prints\n"
            "• 🏪 **North Fan Store** *(Extended)* — Gate 1 corridor · Open now\n"
            "  Full kit range · Kids' sizes · Collector editions\n"
            "• 🛒 **Mini Kiosks:** Near Gates 3, 5, and 7 — pins & scarves only\n\n"
            "💳 Card payments accepted. UPI & digital wallets welcome.\n"
            "⏱️ South Store is less crowded right now — recommended!"
        ),
        "options": [
            "📍 South Store Map", "📍 North Store Map",
            "🚪 Gate 4 Status", "🗺️ Venue Map"
        ]
    }


# ── Smoking Response ─────────────────────────────────────────────────────────

def _resp_smoking(zones, gates) -> Dict[str, Any]:
    return {
        "text": (
            "🚬 **Designated Smoking Areas**\n\n"
            "Smoking is **strictly prohibited** inside the stadium.\n\n"
            "• **East Smoking Zone** — outside Gate 5, ground level\n"
            "• **West Smoking Zone** — outside Gate 6\n\n"
            "Both zones are sheltered and have seating. Please carry your ticket "
            "for re-entry — Gates 5 and 6 allow seamless re-entry with valid passes."
        ),
        "options": [
            "📍 East Zone Map", "📍 West Zone Map",
            "🚪 Gate 5 Re-Entry", "🗺️ Venue Map"
        ]
    }


# ── Schedule Response ─────────────────────────────────────────────────────────

def _resp_schedule(zones, gates) -> Dict[str, Any]:
    tip = _get_proactive_tip(zones, gates)
    return {
        "text": (
            "📅 **Match Schedule & Information**\n\n"
            "• ⏰ **Gates Open:** 17:00 (3 hrs before kickoff)\n"
            "• 🟢 **Kickoff:** 20:00\n"
            "• ☕ **Half-time Break:** 21:00–21:15 (15 minutes)\n"
            "• 🏁 **Full Time:** ~21:45–22:05 (depends on stoppage time)\n"
            "• 🚗 **Recommended Exit:** Stay 5 min after FT — "
            "crowd thins significantly within 8 minutes\n\n"
            "📡 Live updates, match stats, and lineups are available "
            "in the **VenueFlow Match Centre** tab."
        ) + tip,
        "options": [
            "⚽ Live Match Stats", "🚪 Best Exit Gate",
            "🚗 Parking Exit Plan", "🍔 Half-Time Food"
        ]
    }


# ── WiFi Response ────────────────────────────────────────────────────────────

def _resp_wifi(zones, gates) -> Dict[str, Any]:
    return {
        "text": (
            "📶 **Venue WiFi Access**\n\n"
            "• **Network Name:** `VenueFlow_FREE`\n"
            "• **Password:** Not required — open network\n"
            "• **Coverage:** All stands, concourses, food courts, and VIP areas\n"
            "• **Speed:** Up to 50 Mbps shared — optimised for streaming\n\n"
            "For VIP Lounge guests: connect to **VenueFlow_VIP** using your "
            "hospitality welcome pack credentials (10× faster, dedicated bandwidth).\n\n"
            "📶 Having connectivity issues? Visit the Tech Help Desk at Gate 5."
        ),
        "options": [
            "🔋 Charging Stations", "📍 Tech Help Desk",
            "🗺️ Venue Map", "🚪 Gate 5"
        ]
    }


# ── Weather Response ─────────────────────────────────────────────────────────

def _resp_weather(zones, gates) -> Dict[str, Any]:
    return {
        "text": (
            "☁️ **Venue Weather Advisory**\n\n"
            "• 🌡️ **Current Temperature:** 26°C — Partly cloudy\n"
            "• 💨 **Wind:** 14 km/h (North-East) — minimal game impact\n"
            "• 🌧️ **Rain Probability:** 12% — no rain expected this session\n\n"
            "**Covered Areas:** North Stand and West Stand have full roof coverage.\n"
            "**Open Stands:** East Stand and South Stand are partially uncovered.\n\n"
            "💡 If rain develops, concourse areas under Gates 1, 4, and 7 "
            "provide shelter. Ponchos available at Info Desks for ₹40."
        ),
        "options": [
            "🗺️ Covered Seating Map", "📍 Shelter Points",
            "🛍️ Buy Poncho", "🏟️ Venue Overview"
        ]
    }


# ── ATM / Cash Response ──────────────────────────────────────────────────────

def _resp_atm(zones, gates) -> Dict[str, Any]:
    """ATM and cash machine locations."""
    return {
        "text": (
            "💳 **ATM & Cash Machines**\n\n"
            "• 🏧 **ATM 1** — Gate 2 concourse, Level 1 · "
            f"{_walk_time(640)} from main stand · **Open now**\n"
            "• 🏧 **ATM 2** — South Food Hub corridor, Level 1 · "
            f"{_walk_time(180)} · **Open now**\n"
            "• 🏧 **ATM 3** — VIP Lounge entrance, Level 3 · "
            f"{_walk_time(730)} · Open to all\n\n"
            "💡 **Cash Tips:**\n"
            "• All food stalls, merchandise stores, and kiosks accept UPI, "
            "card, and contactless payment.\n"
            "• ATM 2 (South Hub) is the least crowded option right now."
        ),
        "options": [
            "📍 South Hub ATM Map", "🍔 Food Hubs",
            "🛍️ Merchandise", "🗺️ Venue Map"
        ]
    }


# ── Accessibility Response ────────────────────────────────────────────────────

def _resp_accessibility(zones, gates) -> Dict[str, Any]:
    """Accessibility, wheelchair, elevator, and special needs guidance."""
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            "♿ **Accessibility & Mobility Guide**\n\n"
            "**Wheelchair-Friendly Entry:**\n"
            "• Gate 3 (South) — flat ramp, no stairs, widest corridor\n"
            "• Gate 4 (South) — ramped access, dedicated wheelchair lane\n"
            "• Gate 5 (East) — accessible entry, lift available inside\n\n"
            "**Elevators / Lifts:**\n"
            "• North Stand — beside Gate 2 (serves Levels 1–4)\n"
            "• South Stand — beside Gate 4 (serves Levels 1–3)\n"
            "• West Stand — beside Gate 6 (serves all levels)\n\n"
            "**Accessible Restrooms:**\n"
            "• Every level at Gates 3, 4, and 5 — spacious, ground-floor access.\n\n"
            "**Hearing Loops:** Active in VIP Lounge and Media Zone.\n"
            "**Mobility Aids:** Manual wheelchairs available free at the Info Desk (Gate 5).\n"
            "**Sign Language:** Interpreter on duty at Gate 3 Security Desk (match days)."
        ) + safety,
        "options": [
            "🗺️ Accessible Route Map", "🚽 Accessible Restrooms",
            "🏥 Medical Bay", "ℹ️ Info Desk"
        ]
    }


# ── Info Desk Response ────────────────────────────────────────────────────────

def _resp_info_desk(zones, gates) -> Dict[str, Any]:
    """Info desk, lost & found, customer service."""
    tip    = _get_proactive_tip(zones, gates)
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            "ℹ️ **Information Desk & Customer Services**\n\n"
            f"• **Main Info Desk** — Gate 5, Level 1 — "
            f"{_walk_time(290)} from main stand · Open until 1 hr post-event\n"
            f"• **Lost & Found** — North concourse, beside Gate 2 kiosks — "
            f"{_walk_time(640)}\n"
            "• **Tech Help** — Gate 5 Info Desk — WiFi issues, app help, cables\n"
            "• **Complaint / Feedback** — Gate 5 Info Desk or text **CARE** to 56789\n\n"
            "**Services available at Info Desk:**\n"
            "Ponchos (₹40) · Earplugs (₹20) · Phone cables (₹50 deposit) · "
            "Venue maps · First aid kits · Wheelchair loan · Event programs"
        ) + tip + safety,
        "options": [
            "📍 Gate 5 Directions", "🛡️ Security Desk",
            "🏥 Medical Bay", "🗺️ Venue Map"
        ]
    }


# ── Food Responses ───────────────────────────────────────────────────────────

def _resp_food_menu(zones, gates) -> Dict[str, Any]:
    """Food sub-intent: view menu."""
    best, _ = _get_best_food_court(zones)
    best_name = getattr(best, "name", "South Food Hub") if best else "South Food Hub"
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            f"📜 **{best_name} — Menu Highlights**\n\n"
            "🍟 **Snacks:** Loaded Nachos ₹180 · Cheese Fries ₹130 · "
            "Onion Rings ₹110\n"
            "🍔 **Mains:** Signature Burgers ₹220 · Hot Dogs ₹120 · "
            "Veggie Wraps ₹150 · Paneer Rolls ₹160\n"
            "🍕 **Pizzas:** Margherita ₹200 · Pepperoni ₹240 · Thin Crust Veg ₹190\n"
            "🥤 **Drinks:** Cold Drinks ₹80 · Craft Beer ₹220 · "
            "Mocktails ₹140 · Fresh Juice ₹100\n"
            "☕ **Hot Beverages:** Coffee ₹90 · Masala Chai ₹60\n\n"
            "Full allergen info is available at every kiosk. Tap below for more."
        ) + safety,
        "options": ["⏱️ Wait Times", "📍 Get Directions", "🍔 All Food Options"]
    }


def _resp_food_wait(zones, gates) -> Dict[str, Any]:
    """Food sub-intent: wait times / queue status."""
    food_zones = sorted(
        [z for z in zones if "food" in z.zone_id.lower()],
        key=lambda z: getattr(z, "density", 0.5)
    )
    safety = _get_safety_footnote(zones)

    if food_zones:
        lines = ["⏱️ **Live Line Status — All Food Hubs:**\n"]
        for z in food_zones:
            d    = getattr(z, "density", 0.5)
            wt   = getattr(z, "wait_time", _estimate_wait_time(d))
            star = " ✅ *(Recommended)*" if z == food_zones[0] else ""
            lines.append(
                f"• {_density_emoji(d)} **{z.name}** — {wt} wait{star}"
            )
        lines.append(
            f"\n{food_zones[0].name} is your smartest pick right now. "
            "Head there before the next break!"
        )
        text = "\n".join(lines)
    else:
        text = (
            "⏱️ **Live Line Status:**\n"
            "• 🟢 South Food Hub — ~2 min wait ✅ *(Recommended)*\n"
            "• 🟡 North Food Hub — ~8 min wait\n"
            "• 🟠 East Food Hub  — ~12 min wait\n\n"
            "South Hub is your fastest option right now!"
        )
    return {
        "text": text + safety,
        "options": ["📍 Get Directions", "📜 View Menus", "🍔 All Food Options"]
    }


def _resp_food_directions(zones, gates) -> Dict[str, Any]:
    """Food sub-intent: directions to nearest food hub."""
    best, _ = _get_best_food_court(zones)
    best_name = getattr(best, "name", "South Food Hub") if best else "South Food Hub"
    safety = _get_safety_footnote(zones)
    dist   = VENUE_DISTANCES.get("food_court_south", 180)
    wtime  = _walk_time(dist)
    return {
        "text": (
            f"📍 **Directions to {best_name}**\n\n"
            "1. From your section, head toward **Section C** (look for yellow signage).\n"
            "2. Take the **escalator down to Level 1** — it's right at Section C.\n"
            "3. Follow the 🟢 **green floor markers** — they lead straight to the hub.\n"
            "4. You'll see the orange **'Food Zone'** overhead banners on arrival.\n\n"
            f"⏱️ Estimated walking time: **{wtime}** at a comfortable pace.\n"
            "Tip: Level 1 corridor is wider and less congested than Level 2."
        ) + safety,
        "options": ["📜 View Menus", "⏱️ Wait Times", "🚪 Gates"]
    }


def _resp_food_general(zones, gates) -> Dict[str, Any]:
    """Top-level food intent."""
    best, worst = _get_best_food_court(zones)
    best_name  = getattr(best, "name", "South Hub") if best else "South Hub"
    worst_name = getattr(worst, "name", "North Hub") if worst else "North Hub"
    best_d     = getattr(best, "density", 0.3) if best else 0.3
    tip        = _get_proactive_tip(zones, gates)
    safety     = _get_safety_footnote(zones)
    return {
        "text": (
            f"🍔 **{best_name} is your best food option right now.**\n"
            f"Line is {_density_label(best_d).lower()} — "
            f"estimated {_estimate_wait_time(best_d)} wait. "
            f"{worst_name} is significantly busier, so skip that one for now.\n\n"
            "What would you like to do?"
        ) + tip + safety,
        "options": ["📜 View Menus", "⏱️ Wait Times", "📍 Get Directions"]
    }


# ── Gate Responses ────────────────────────────────────────────────────────────

def _resp_gate_walking(zones, gates) -> Dict[str, Any]:
    """Gate sub-intent: walking times."""
    ranked = _rank_gates(gates)
    safety = _get_safety_footnote(zones)

    if ranked:
        lines = ["🚶 **Walking Times — All Gates:**\n"]
        for g in ranked:
            d    = getattr(g, "density", 0.5)
            wt   = getattr(g, "walk_time", None) or _walk_time(
                VENUE_DISTANCES.get(f"gate_{g.gate_id.split('_')[-1]}", 400)
            )
            star = " 🏆 *(Fastest exit)*" if g == ranked[0] else (
                " 🚫 *(Avoid — surge)*" if g == ranked[-1] else ""
            )
            lines.append(f"• {_density_emoji(d)} **{g.name}** — {wt}{star}")
        lines.append(f"\n**Use {ranked[0].name} for the fastest exit right now.**")
        text = "\n".join(lines)
    else:
        text = (
            "🚶 **Walking Times from Main Stand:**\n"
            "• Gate 4 — ~3 min  🟢 *(Fastest)*\n"
            "• Gate 5 — ~4 min  🟢\n"
            "• Gate 2 — ~7 min  🟡\n"
            "• Gate 3 — ~9 min  🟡\n"
            "• Gate 1 (North) — ~11 min  🔴 *(Avoid — peak surge)*\n\n"
            "**Gate 4 is your fastest exit right now!**"
        )
    return {
        "text": text + safety,
        "options": ["🗺️ Entry Map", "🚗 Parking Status", "🚪 All Gates"]
    }


def _resp_gate_parking(zones, gates) -> Dict[str, Any]:
    """Gate sub-intent: parking status."""
    tip    = _get_proactive_tip(zones, gates)
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            "🚗 **Live Parking Status**\n\n"
            "• 🟢 **Zone A** *(South Gate)* — 60% full · "
            f"{_walk_time(VENUE_DISTANCES['parking_zone_a'])} · **Best choice**\n"
            "• 🔴 **Zone B** *(North Gate)* — 98% full · Avoid entirely\n"
            "• 🟡 **Zone C** *(East side)* — 80% full · "
            f"{_walk_time(VENUE_DISTANCES['parking_zone_c'])} · Limited\n"
            "• 🟢 **Overflow Lot D** *(off South Road)* — 40% full · "
            "Shuttle available every 10 min\n\n"
            "**Head to Zone A via South Gate** — "
            "smoothest exit flow after the match."
        ) + tip + safety,
        "options": [
            "🚪 Best Gate to Zone A", "🚶 Walking Route",
            "🗺️ Parking Map", "⏰ Exit Timing"
        ]
    }


def _resp_gate_general(zones, gates) -> Dict[str, Any]:
    """Top-level gate intent."""
    ranked = _rank_gates(gates)
    safety = _get_safety_footnote(zones)
    tip    = _get_proactive_tip(zones, gates)

    if ranked:
        best = ranked[0]
        bad  = ranked[-1]
        lines = [
            f"🚪 **Gate Intelligence — {len(ranked)} Gates Monitored**\n"
        ]
        for g in ranked[:4]:  # show top 4
            lines.append(_gate_status_line(g))
        if len(ranked) > 4:
            lines.append(f"  … and {len(ranked)-4} more gates.")
        lines.append(
            f"\n✅ **Use {best.name}** for seamless entry right now. "
            f"{'⛔ Avoid ' + bad.name + ' — at peak surge.' if getattr(bad,'density',0) > DENSITY_HIGH else ''}"
        )
        text = "\n".join(lines)
    else:
        text = (
            "🚪 **Gate Analysis:**\n"
            "• Gate 4 & 5 — Seamless Entry · zero wait 🟢\n"
            "• Gate 2 & 3 — Light line · ~3 min wait 🟡\n"
            "• Gate 1 (North) — Peak surge · Avoid 🔴\n\n"
            "**Gate 4 is your best bet right now.**"
        )
    return {
        "text": text + tip + safety,
        "options": [
            "🚶 Walking Times", "🗺️ Entry Map",
            "🚗 Parking Status", "📍 Best Route"
        ]
    }


# ── Map Response ─────────────────────────────────────────────────────────────

def _resp_map(zones, gates) -> Dict[str, Any]:
    """Venue layout overview."""
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            "🗺️ **Venue Layout — Complete Guide**\n\n"
            "🏟️ **Stands & Zones:**\n"
            "• **North Stand** — Gates 1 & 2 · VIP Lounge (L3) · "
            "Media Zone · Merch Store\n"
            "• **South Stand** — Gates 3 & 4 · Family Zone · "
            "South Food Hub · Fan Store\n"
            "• **East Stand**  — Gate 5 · North Food Hub · "
            "East Charging Hub · Smoking Zone\n"
            "• **West Stand**  — Gates 6 & 7 · Restrooms every level · "
            "West Charging Hub · Smoking Zone\n\n"
            "🚻 **Restrooms:** Levels 1–3 at every major stand.\n"
            "🏥 **Medical Bay:** Level 1, Section B (Gate 3 corridor).\n"
            "🛡️ **Security Desk:** Gate 3 entrance.\n"
            "📍 **Info Desk:** Gate 5 — lost & found, tech help, ponchos.\n\n"
            "Use the **Live Map** tab in the app for real-time crowd overlays."
        ) + safety,
        "options": [
            "🚪 Gate Status", "🍔 Food Hubs",
            "🚽 Restrooms", "🏥 Medical Points"
        ]
    }


# ── Restroom Response ────────────────────────────────────────────────────────

def _resp_restroom(zones, gates) -> Dict[str, Any]:
    """Nearest restroom with occupancy."""
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            "🚽 **Restroom Status — All Levels**\n\n"
            f"• 🟢 **Level 2 — Near Gate 4** — {_walk_time(VENUE_DISTANCES['restroom_l2_gate4'])} "
            "· **Least crowded** ✅ *(Recommended)*\n"
            f"• 🟡 **Level 1 — Section B corridor** — "
            f"{_walk_time(VENUE_DISTANCES['restroom_l1_sectionb'])} · Moderate\n"
            f"• 🟡 **Level 3 — West Stand passage** — "
            f"{_walk_time(VENUE_DISTANCES['restroom_l3_west'])} · Moderate\n"
            "• 🔴 **Level 1 — Gate 1 (North)** — Very busy, long wait\n\n"
            "🔵 **Accessible restrooms** at Gates 3, 4, and 5 (ground level, no stairs).\n"
            "👶 **Baby changing** at Level 1 Gate 3 and Level 2 Gate 4."
        ) + safety,
        "options": [
            "📍 Get Directions", "🗺️ Venue Map",
            "🍔 Nearby Food", "🚪 Gates"
        ]
    }


# ── Greeting Response ────────────────────────────────────────────────────────

def _resp_greeting(zones, gates) -> Dict[str, Any]:
    """Welcome / greeting."""
    ranked = _rank_gates(gates)
    best_gate = ranked[0].name if ranked else "Gate 4"
    best_food, _ = _get_best_food_court(zones)
    best_food_name = getattr(best_food, "name", "South Hub") if best_food else "South Hub"
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            f"👋 **Welcome to VenueFlow AI!**\n\n"
            "I'm your real-time premium concierge — tracking every gate, "
            "zone, food hub, and crowd density right now.\n\n"
            f"⚡ **Live Snapshot:**\n"
            f"• Fastest gate: **{best_gate}**\n"
            f"• Shortest food line: **{best_food_name}**\n"
            f"• {len([z for z in zones if getattr(z,'density',0) > DENSITY_HIGH])} "
            "zone(s) at critical load — I'll keep you clear of those.\n\n"
            "**How can I make your experience better today?**"
        ) + safety,
        "options": ["🍔 I'm Hungry", "🚪 Find Best Gate", "📍 Venue Map"]
    }


# ── Fallback Response ────────────────────────────────────────────────────────

def _resp_fallback(zones, gates) -> Dict[str, Any]:
    """Catch-all fallback — shown when nothing else matches."""
    tip    = _get_proactive_tip(zones, gates)
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            "I'm here to help with anything inside the venue! 🏟️\n\n"
            "Try asking me about:\n"
            "• **Gates** — fastest entry/exit right now\n"
            "• **Food** — shortest line, menus, directions\n"
            "• **Restrooms** — nearest and least crowded\n"
            "• **Parking** — zone availability and exit strategy\n"
            "• **Charging** — phone charging station locations\n"
            "• **Emergency** — medical, security, evacuation help\n\n"
            "Or just type what you need in plain language — I'll figure it out!"
        ) + tip + safety,
        "options": ["🍔 Food", "🚪 Gates", "📍 Map", "🛟 Emergency"]
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MASTER INTENT ROUTER — _get_mock_response()
#  Ordered from highest priority (emergency) to lowest (fallback).
#  Each branch is explicit so button clicks always get the correct response.
# ═══════════════════════════════════════════════════════════════════════════════

def _get_mock_response(user_message: str) -> Dict[str, Any]:
    """
    Structured response engine.
    Resolves intent in priority order and returns a fully-formatted response.
    Never touches the Gemini API — all responses are deterministic.
    """
    zones = get_all_zones()
    gates = get_all_gates()
    msg   = user_message.lower().strip()

    # ── PRIORITY 0: Emergency / Safety ──────────────────────────────────────
    is_emergency = (
        _check_intent(msg, INTENT_KEYWORDS["emergency"])
        or _check_intent(msg, INTENT_KEYWORDS["fire"])
        or _check_intent(msg, INTENT_KEYWORDS["fight"])
        or _check_intent(msg, INTENT_KEYWORDS["suspicious"])
        or _check_intent(msg, INTENT_KEYWORDS["medical"])
    )
    if is_emergency:
        return _resp_emergency(msg, zones, gates)

    # ── PRIORITY 1: Security / Lost Items ────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["security"]):
        return _resp_security(zones, gates)

    # ── PRIORITY 2: VIP / Premium ─────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["vip"]):
        return _resp_vip(zones, gates)

    # ── PRIORITY 3: Charging / Power ─────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["charging"]):
        return _resp_charging(zones, gates)

    # ── PRIORITY 4: Family / Kids ─────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["family"]):
        return _resp_family(zones, gates)

    # ── PRIORITY 5: Merchandise ───────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["merchandise"]):
        return _resp_merchandise(zones, gates)

    # ── PRIORITY 6: Smoking ───────────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["smoking"]):
        return _resp_smoking(zones, gates)

    # ── PRIORITY 7: Schedule ──────────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["schedule"]):
        return _resp_schedule(zones, gates)

    # ── PRIORITY 8: WiFi / Connectivity ──────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["wifi"]):
        return _resp_wifi(zones, gates)

    # ── PRIORITY 9: Weather ───────────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["weather"]):
        return _resp_weather(zones, gates)

    # ── PRIORITY 10: ATM / Cash ───────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["atm"]):
        return _resp_atm(zones, gates)

    # ── PRIORITY 11: Accessibility / Mobility ────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["accessibility"]):
        return _resp_accessibility(zones, gates)

    # ── PRIORITY 12: Info Desk / Lost & Found ────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["info_desk"]):
        return _resp_info_desk(zones, gates)

    # ── PRIORITY 13: Food Sub-Intents (must precede general food) ────────────
    if _check_intent(msg, INTENT_KEYWORDS["menu"]):
        return _resp_food_menu(zones, gates)

    if _check_intent(msg, INTENT_KEYWORDS["wait"]):
        return _resp_food_wait(zones, gates)

    if _check_intent(msg, INTENT_KEYWORDS["directions"]):
        return _resp_food_directions(zones, gates)

    # ── PRIORITY 14: Gate Sub-Intents (must precede general gate) ────────────
    if _check_intent(msg, INTENT_KEYWORDS["walking"]):
        return _resp_gate_walking(zones, gates)

    if _check_intent(msg, INTENT_KEYWORDS["parking"]):
        return _resp_gate_parking(zones, gates)

    # ── PRIORITY 15: Restroom ─────────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["restroom"]):
        return _resp_restroom(zones, gates)

    # ── PRIORITY 16: Map / Layout ─────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["map"]):
        return _resp_map(zones, gates)

    # ── PRIORITY 17: General Food ─────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["food"]):
        return _resp_food_general(zones, gates)

    # ── PRIORITY 15: General Gate ─────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["gate"]):
        return _resp_gate_general(zones, gates)

    # ── PRIORITY 16: Greeting ─────────────────────────────────────────────────
    if _check_intent(msg, INTENT_KEYWORDS["greeting"]):
        return _resp_greeting(zones, gates)

    # ── FALLBACK ──────────────────────────────────────────────────────────────
    return _resp_fallback(zones, gates)


# ═══════════════════════════════════════════════════════════════════════════════
#  CONTEXT-REDIRECT HANDLER  (dashboard → chat bridge)
# ═══════════════════════════════════════════════════════════════════════════════

def _handle_context_redirect(user_message: str) -> Dict[str, Any]:
    """
    Handle [CONTEXT_REDIRECT] messages originating from the map dashboard.
    Provides deeper operational intelligence for clicked zones/features.
    """
    zones    = get_all_zones()
    gates    = get_all_gates()
    msg_lower = user_message.lower()

    # ── 🍔 Food Hub Redirect ─────────────────────────────────────────────────
    if "food" in msg_lower:
        best, worst = _get_best_food_court(zones)
        best_name   = getattr(best, "name", "South Hub") if best else "South Hub"
        worst_name  = getattr(worst, "name", "North Hub") if worst else "North Hub"
        best_wait   = _estimate_wait_time(getattr(best, "density", 0.3)) if best else "~3 min"
        worst_wait  = _estimate_wait_time(getattr(worst, "density", 0.7)) if worst else "~12 min"
        tip         = _get_proactive_tip(zones, gates)
        return {
            "text": (
                f"🍔 **Food Hub Intelligence — Dashboard Redirect**\n\n"
                f"• ✅ **{best_name}** — {best_wait} wait · "
                "**30% faster service** — Recommended\n"
                f"• 🟠 **{worst_name}** — {worst_wait} wait · Avoid during peak\n\n"
                "🔥 **Trending:** Loaded Nachos · Signature Burgers · Craft Soda\n\n"
                "Would you like me to map the fastest walking route for you?"
            ) + tip,
            "options": ["📍 Get Directions", "📜 View Menus", "⏱️ Wait Times"]
        }

    # ── 🚗 Parking Redirect ──────────────────────────────────────────────────
    if "parking" in msg_lower:
        tip = _get_proactive_tip(zones, gates)
        return {
            "text": (
                "🚗 **Parking Intelligence — Dashboard Redirect**\n\n"
                "• 🟢 **Zone A** — 65% capacity · Best exit strategy · "
                f"{_walk_time(VENUE_DISTANCES['parking_zone_a'])} from Gate 4\n"
                "• 🔴 **Zone B** — 98% full · Avoid completely\n"
                "• 🟡 **Zone C** — 80% full · Last resort option\n"
                "• 🟢 **Overflow D** — 40% full · Shuttle every 10 min\n\n"
                "🟢 **Zone A via South Gate** — green markers active for "
                "seamless post-event departure."
            ) + tip,
            "options": ["🚪 Best Gate for Zone A", "🗺️ Parking Map", "⏰ Exit Timing"]
        }

    # ── 🚪 Gate Redirect ─────────────────────────────────────────────────────
    if any(w in msg_lower for w in ["gate", "entry", "exit", "entrance"]):
        ranked = _rank_gates(gates)
        safety = _get_safety_footnote(zones)
        tip    = _get_proactive_tip(zones, gates)
        if ranked:
            lines = ["🚪 **Gate Intelligence — Dashboard Redirect**\n"]
            for g in ranked:
                lines.append(_gate_status_line(g))
            lines.append(
                f"\n✅ **Best choice: {ranked[0].name}** — "
                f"{'⛔ ' + ranked[-1].name + ' at critical load, avoid.' if getattr(ranked[-1],'density',0) > DENSITY_HIGH else 'All other gates operational.'}"
            )
            text = "\n".join(lines)
        else:
            text = (
                "🚪 **Gate Intelligence — Dashboard Redirect**\n\n"
                "• Gate 4 & 5 — Seamless · zero wait 🟢\n"
                "• Gate 2 & 3 — Light line 🟡\n"
                "• Gate 1     — Surge · Avoid 🔴"
            )
        return {
            "text": text + tip + safety,
            "options": ["🚶 Walking Times", "🚗 Parking", "🗺️ Entry Map"]
        }

    # ── 🚽 Restroom Redirect ──────────────────────────────────────────────────
    if any(w in msg_lower for w in ["restroom", "toilet", "bathroom", "washroom"]):
        return _resp_restroom(zones, gates)

    # ── 🔋 Charging Redirect ──────────────────────────────────────────────────
    if any(w in msg_lower for w in ["charging", "charge", "power", "battery"]):
        return _resp_charging(zones, gates)

    # ── 🏥 Medical Redirect ───────────────────────────────────────────────────
    if any(w in msg_lower for w in ["medical", "first aid", "help point"]):
        return _resp_emergency("medical", zones, gates)

    # ── 🏟️ Generic Stand / Zone Redirect ─────────────────────────────────────
    target_zone = next(
        (z for z in zones if z.name.lower() in msg_lower), None
    )
    name    = target_zone.name    if target_zone else "this area"
    density = getattr(target_zone, "density", None)
    density_str = f"{round(density * 100)}%" if density is not None else "active"
    label   = _density_label(density) if density is not None else "operational"

    # Contextual gate suggestion based on zone name
    best_gate = "Gate 4"
    if "south"  in name.lower(): best_gate = "Gate 3 or Gate 4"
    elif "north" in name.lower(): best_gate = "Gate 2"
    elif "east"  in name.lower(): best_gate = "Gate 5"
    elif "west"  in name.lower(): best_gate = "Gate 6 or Gate 7"
    elif "vip"   in name.lower(): best_gate = "Gate 7 (VIP Lane)"
    elif "family" in name.lower(): best_gate = "Gate 3 (Family Entry)"

    tip    = _get_proactive_tip(zones, gates)
    safety = _get_safety_footnote(zones)
    return {
        "text": (
            f"🏟️ **Zone Intelligence: {name}**\n\n"
            f"• **Current Load:** {density_str} utilised · {label}\n"
            f"• **Recommended Gate:** {best_gate} — fastest entry/exit\n"
            "• **Corridor:** Avoid the North side; use South or East routes for clear flow.\n\n"
            "I'm monitoring this zone in real-time. Do you need a route or further detail?"
        ) + tip + safety,
        "options": [
            "🚪 Find Best Gate", "🗺️ Venue Map",
            "⏱️ Line Status", "📍 Get Directions"
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  GEMINI OPTION INFERENCE  (used to derive buttons from LLM response text)
# ═══════════════════════════════════════════════════════════════════════════════

def _infer_options_from_reply(reply_lower: str) -> List[str]:
    """
    Inspect the LLM's reply text and return the most relevant follow-up buttons.
    Ordered from most specific match to generic fallback.
    """
    # Emergency
    if any(w in reply_lower for w in ["emergency", "evacuate", "first aid", "security"]):
        return ["🏥 Medical Bay", "🛡️ Security Desk", "🚪 Emergency Exit"]
    # Medical
    if any(w in reply_lower for w in ["medical", "doctor", "nurse", "ambulance"]):
        return ["📍 Medical Bay", "🛡️ Security Desk", "🚪 Nearest Gate"]
    # VIP
    if any(w in reply_lower for w in ["vip", "lounge", "hospitality", "premium"]):
        return ["🗺️ VIP Map", "🍽️ Executive Dining", "🚪 Gate 7"]
    # Charging
    if any(w in reply_lower for w in ["charge", "battery", "power", "plug"]):
        return ["📍 East Hub Map", "📍 West Hub Map", "🗺️ Venue Map"]
    # Parking
    if any(w in reply_lower for w in ["park", "parking", "zone a", "zone b"]):
        return ["🚪 Best Gate", "🚶 Walking Route", "🗺️ Parking Map"]
    # Restroom
    if any(w in reply_lower for w in ["restroom", "toilet", "bathroom", "washroom"]):
        return ["📍 Get Directions", "🗺️ Venue Map", "🍔 Nearby Food"]
    # Menu
    if any(w in reply_lower for w in ["menu", "nachos", "burger", "price", "items"]):
        return ["⏱️ Wait Times", "📍 Get Directions", "🍔 Back to Food"]
    # Wait / queue
    if any(w in reply_lower for w in ["wait", "queue", "crowd", "minute"]):
        return ["📍 Get Directions", "📜 View Menus", "🍔 Back to Food"]
    # Directions / navigation
    if any(w in reply_lower for w in ["follow", "walk", "corridor", "escalator", "marker"]):
        return ["📜 View Menus", "⏱️ Wait Times", "🚪 Gates"]
    # Food general
    if any(w in reply_lower for w in ["food", "hungry", "eat", "hub", "snack"]):
        return ["📜 View Menus", "⏱️ Wait Times", "📍 Get Directions"]
    # Gate
    if any(w in reply_lower for w in ["gate", "exit", "entry", "entrance"]):
        return ["🚶 Walking Times", "🗺️ Entry Map", "🚗 Parking Status"]
    # Map / layout
    if any(w in reply_lower for w in ["map", "layout", "section", "stand", "level"]):
        return ["🚪 Gate Status", "🍔 Food Hubs", "🚽 Restrooms"]
    # Schedule
    if any(w in reply_lower for w in ["kickoff", "halftime", "match", "schedule"]):
        return ["⚽ Live Stats", "🚪 Best Exit Gate", "🍔 Half-Time Food"]
    # Generic fallback
    return ["🍔 Food", "🚪 Gates", "📍 Map"]


# ═══════════════════════════════════════════════════════════════════════════════
#  GEMINI PROMPT BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

def _build_gemini_prompt(user_message: str, context: str = "") -> str:
    """
    Build the full prompt to send to Gemini.
    Injects live venue context so the model has full situational awareness.
    """
    zones = get_all_zones()
    gates = get_all_gates()
    live  = _build_live_context(zones, gates)

    parts = []

    if context:
        parts.append(f"### ADDITIONAL CONTEXT PROVIDED BY CALLER ###\n{context}\n")

    parts.append(live)
    parts.append(
        "\n### RESPONSE FORMAT ###\n"
        "• Keep the answer under 4 concise sentences unless listing items.\n"
        "• Use bullet points for lists.\n"
        "• Start with the best recommendation.\n"
        "• End with a suggested next action.\n"
        "• Use relevant emoji sparingly (max 2 per response).\n"
        "• NEVER fabricate data not present in the context above.\n"
    )
    parts.append(f"\n### USER QUESTION ###\n{user_message}")

    return "\n".join(parts)


# ═══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API — chat()
# ═══════════════════════════════════════════════════════════════════════════════

    # ── Phase 5: Aesthetic Delay (Pre-return) ────────────────────────────────
    # We ensure a minimum "thinking" time so the user sees the 3-dot animation.
    # This makes the AI feel more thoughtful and premium.
    # Emergency responses skip this delay for safety.

    # Detect if we should skip delay (emergency or medical)
    is_urgent = (
        _check_intent(user_message, INTENT_KEYWORDS["emergency"])
        or _check_intent(user_message, INTENT_KEYWORDS["fire"])
        or _check_intent(user_message, INTENT_KEYWORDS["medical"])
    )

    if not is_urgent:
        elapsed = time.monotonic() - start_time
        if elapsed < CHAT_MIN_DELAY:
            sleep_time = CHAT_MIN_DELAY - elapsed
            logger.debug("Applying aesthetic delay of %.3fs", sleep_time)
            time.sleep(sleep_time)

    return result


def chat(
    user_message: str,
    context: str = "",
    user_location: Optional[str] = None,
    event_phase: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Main entry-point for the VenueFlow AI chat engine.

    Returns
    -------
    dict
        {"text": str, "options": list[str]}
    """
    start_time = time.monotonic()
    logger.debug(
        "chat() called | message=%r | location=%r | phase=%r",
        user_message[:60], user_location, event_phase
    )

    # ── Phase 0: Sanitise input ──────────────────────────────────────────────
    user_message = (user_message or "").strip()
    if not user_message:
        return _resp_fallback(get_all_zones(), get_all_gates())

    # ── Phase 1: Context-redirect intercept ──────────────────────────────────
    if "[CONTEXT_REDIRECT]" in user_message:
        result = _handle_context_redirect(user_message)
    elif _matches_any_known_intent(user_message):
        # ── Phase 2: Known intent or Location prefix ──────────────────────────
        location_context = ""
        if user_location:
            location_context = f"[USER LOCATION: {user_location}] "
        result = _get_mock_response(location_context + user_message)
    else:
        # ── Phase 3: Gemini LLM Phase ─────────────────────────────────────────
        try:
            client = _get_client()
            if not client:
                result = _get_mock_response(user_message)
            else:
                gemini_model = getattr(Config, "GEMINI_MODEL", _DEFAULT_MODEL)
                full_prompt  = _build_gemini_prompt(user_message, context)

                if conversation_history:
                    history_lines = []
                    for turn in conversation_history[-6:]:
                        role = "User" if turn.get("role") == "user" else "Assistant"
                        history_lines.append(f"{role}: {turn.get('text','')}")
                    if history_lines:
                        full_prompt = "### CONVERSATION HISTORY ###\n" + "\n".join(history_lines) + "\n\n" + full_prompt

                response = client.models.generate_content(
                    model=gemini_model,
                    contents=full_prompt,
                    config={
                        "system_instruction": SYSTEM_PROMPT,
                        "temperature": 0.65,
                        "max_output_tokens": 512,
                    }
                )

                reply_text = (response.text or "").strip()
                if not reply_text:
                    raise ValueError("Empty response from Gemini")

                options = _infer_options_from_reply(reply_text.lower())
                reply_text += _get_safety_footnote(get_all_zones())
                result = {"text": reply_text, "options": options}

        except Exception as exc:
            logger.error("Gemini call failed: %s", exc)
            result = _get_mock_response(user_message)

    logger.debug("chat() resolved in %.3fs", time.monotonic() - start_time)
    return result


# ═══════════════════════════════════════════════════════════════════════════════
#  ANALYTICS & DIAGNOSTICS  (optional helpers for backend monitoring)
# ═══════════════════════════════════════════════════════════════════════════════

def get_intent_debug(user_message: str) -> Dict[str, Any]:
    """
    Diagnostic helper — returns all matching intent groups for a message.
    Useful for testing keyword coverage and debugging routing decisions.

    Returns
    -------
    dict
        {
            "message": str,
            "clean_message": str,
            "matches": {intent_name: bool},
            "routed_to": str,
            "is_context_redirect": bool,
        }
    """
    clean = re.sub(r"[^\w\s']", " ", user_message).lower()
    matches = {
        name: _check_intent(user_message, kws)
        for name, kws in INTENT_KEYWORDS.items()
    }

    # Determine what the router would select (mirrors _get_mock_response order)
    routed_to = "fallback"
    is_emergency_match = (
        matches.get("emergency") or matches.get("fire")
        or matches.get("fight") or matches.get("suspicious")
        or matches.get("medical")
    )
    priority_order = [
        ("emergency",    is_emergency_match),
        ("security",     matches.get("security",     False)),
        ("vip",          matches.get("vip",          False)),
        ("charging",     matches.get("charging",     False)),
        ("family",       matches.get("family",       False)),
        ("merchandise",  matches.get("merchandise",  False)),
        ("smoking",      matches.get("smoking",      False)),
        ("schedule",     matches.get("schedule",     False)),
        ("wifi",         matches.get("wifi",         False)),
        ("weather",      matches.get("weather",      False)),
        ("menu",         matches.get("menu",         False)),
        ("wait",         matches.get("wait",         False)),
        ("directions",   matches.get("directions",   False)),
        ("walking",      matches.get("walking",      False)),
        ("parking",      matches.get("parking",      False)),
        ("restroom",     matches.get("restroom",     False)),
        ("map",          matches.get("map",          False)),
        ("food",         matches.get("food",         False)),
        ("gate",         matches.get("gate",         False)),
        ("greeting",     matches.get("greeting",     False)),
    ]
    for intent_name, matched in priority_order:
        if matched:
            routed_to = intent_name
            break

    return {
        "message":            user_message,
        "clean_message":      clean,
        "matches":            {k: v for k, v in matches.items() if v},
        "routed_to":          routed_to,
        "is_context_redirect": "[CONTEXT_REDIRECT]" in user_message,
    }


def get_venue_health_summary() -> Dict[str, Any]:
    """
    Returns a structured health summary of the venue for dashboards or logging.
    Aggregates zone densities, gate statuses, critical alerts.
    """
    zones = get_all_zones()
    gates = get_all_gates()

    critical_zones = [
        z.name for z in zones if getattr(z, "density", 0) > DENSITY_HIGH
    ]
    ranked_gates = _rank_gates(gates)
    best_gate    = ranked_gates[0].name  if ranked_gates else "Unknown"
    worst_gate   = ranked_gates[-1].name if ranked_gates else "Unknown"

    best_food, worst_food = _get_best_food_court(zones)

    return {
        "total_zones":      len(zones),
        "total_gates":      len(gates),
        "critical_zones":   critical_zones,
        "critical_count":   len(critical_zones),
        "best_gate":        best_gate,
        "worst_gate":       worst_gate,
        "best_food_court":  getattr(best_food, "name", "N/A") if best_food else "N/A",
        "worst_food_court": getattr(worst_food, "name", "N/A") if worst_food else "N/A",
        "overall_status":   "CRITICAL" if critical_zones else "NORMAL",
        "proactive_tip":    _get_proactive_tip(zones, gates).strip(),
    }


def reset_gemini_client() -> None:
    """
    Force-reset the Gemini singleton (useful after API key rotation or tests).
    """
    global _client
    _client = None
    logger.info("Gemini client singleton reset.")


# ═══════════════════════════════════════════════════════════════════════════════
#  QUICK SELF-TEST  (run with: python -m backend.services.gemini_service)
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
#  CONVERSATION STATE TRACKER
#  Lightweight per-session object that VenueFlow's API layer can instantiate
#  to carry context across multiple chat() calls without relying on Redis or
#  an external store for conversational memory.
# ═══════════════════════════════════════════════════════════════════════════════

class ConversationState:
    """
    Tracks per-user session context across multiple turns.

    Usage (in your API view / websocket handler):

        state = ConversationState(session_id="abc123")
        response = chat(
            user_message,
            conversation_history=state.history_for_gemini(),
            user_location=state.last_known_location,
            event_phase=state.event_phase,
        )
        state.record_turn(user_message, response["text"])

    The object is intentionally lightweight and JSON-serialisable so it can
    be stored in Redis, a session cookie, or passed around as a dict.
    """

    MAX_HISTORY_TURNS: int = 10   # keep last N user+assistant pairs

    def __init__(
        self,
        session_id: str = "",
        event_phase: str = "live",
        user_location: Optional[str] = None,
    ) -> None:
        self.session_id:           str                         = session_id
        self.event_phase:          str                         = event_phase
        self.last_known_location:  Optional[str]               = user_location
        self.turn_count:           int                         = 0
        self.last_intent:          str                         = "unknown"
        self.emergency_flagged:    bool                        = False
        self._history:             List[Dict[str, str]]        = []
        self._created_at:          float                       = time.monotonic()

    # ── Public API ───────────────────────────────────────────────────────────

    def record_turn(self, user_text: str, assistant_text: str) -> None:
        """Add a completed exchange to the in-memory history."""
        self._history.append({"role": "user",      "text": user_text})
        self._history.append({"role": "assistant",  "text": assistant_text})
        self.turn_count += 1
        # Prune to window
        max_entries = self.MAX_HISTORY_TURNS * 2
        if len(self._history) > max_entries:
            self._history = self._history[-max_entries:]

    def history_for_gemini(self) -> List[Dict[str, str]]:
        """Return history slice suitable for injecting into Gemini prompts."""
        return list(self._history)

    def update_location(self, location: str) -> None:
        """Update the user's last-known location inside the venue."""
        self.last_known_location = location
        logger.debug("[%s] Location updated → %s", self.session_id, location)

    def flag_emergency(self) -> None:
        """Mark this session as having encountered an emergency query."""
        self.emergency_flagged = True
        logger.warning("[%s] Emergency flag set on session.", self.session_id)

    def set_event_phase(self, phase: str) -> None:
        """Update the event phase: pre_event | live | halftime | post_event."""
        valid = {"pre_event", "live", "halftime", "post_event"}
        if phase not in valid:
            raise ValueError(f"Invalid event phase '{phase}'. Must be one of {valid}.")
        self.event_phase = phase

    def to_dict(self) -> Dict[str, Any]:
        """Serialise state to a plain dict (e.g. for Redis storage)."""
        return {
            "session_id":          self.session_id,
            "event_phase":         self.event_phase,
            "last_known_location": self.last_known_location,
            "turn_count":          self.turn_count,
            "last_intent":         self.last_intent,
            "emergency_flagged":   self.emergency_flagged,
            "history":             self._history,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationState":
        """Reconstruct a ConversationState from a serialised dict."""
        obj = cls(
            session_id    = data.get("session_id", ""),
            event_phase   = data.get("event_phase", "live"),
            user_location = data.get("last_known_location"),
        )
        obj.turn_count        = data.get("turn_count", 0)
        obj.last_intent       = data.get("last_intent", "unknown")
        obj.emergency_flagged = data.get("emergency_flagged", False)
        obj._history          = data.get("history", [])
        return obj

    def __repr__(self) -> str:
        return (
            f"ConversationState(session_id={self.session_id!r}, "
            f"turns={self.turn_count}, phase={self.event_phase!r}, "
            f"location={self.last_known_location!r}, "
            f"emergency={self.emergency_flagged})"
        )


# ═══════════════════════════════════════════════════════════════════════════════
#  RATE-LIMIT GUARD  (simple in-process token bucket per session)
#  Prevents a single session from hammering the Gemini API.
#  Production deployments should use Redis-backed rate limiting instead.
# ═══════════════════════════════════════════════════════════════════════════════

class _RateLimitGuard:
    """
    Simple token-bucket rate limiter for Gemini API calls.

    Defaults: 20 calls per minute per session.
    When the bucket is exhausted the call falls through to _get_mock_response
    instead of hitting the Gemini endpoint.
    """

    REFILL_RATE:   float = 20.0 / 60.0  # tokens per second
    BUCKET_MAX:    float = 20.0

    def __init__(self) -> None:
        self._buckets: Dict[str, Tuple[float, float]] = {}
        # {session_id: (tokens, last_refill_timestamp)}

    def consume(self, session_id: str = "default") -> bool:
        """
        Attempt to consume one token for the given session.
        Returns True if allowed; False if rate-limited.
        """
        now    = time.monotonic()
        tokens, last = self._buckets.get(session_id, (self.BUCKET_MAX, now))

        # Refill
        elapsed = now - last
        tokens  = min(self.BUCKET_MAX, tokens + elapsed * self.REFILL_RATE)

        if tokens >= 1.0:
            self._buckets[session_id] = (tokens - 1.0, now)
            return True
        else:
            self._buckets[session_id] = (tokens, now)
            logger.warning("Rate limit hit for session %r", session_id)
            return False

    def reset(self, session_id: str = "default") -> None:
        """Reset a session's token bucket (useful after authentication)."""
        self._buckets.pop(session_id, None)


_rate_limiter = _RateLimitGuard()


# ═══════════════════════════════════════════════════════════════════════════════
#  QUICK SELF-TEST  (run with: python -m backend.services.gemini_service)
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import json
    logging.basicConfig(level=logging.DEBUG)

    _TEST_PROMPTS = [
        "hi there!",
        "Where is the fastest gate?",
        "I'm hungry, what food is available?",
        "Show me the menu",
        "How long is the queue at the south food hub?",
        "Directions to the food court please",
        "Where can I park after the match?",
        "Walking time to gates",
        "Nearest restroom?",
        "Where can I charge my phone?",
        "Is there a family area?",
        "Where can I buy a jersey?",
        "Smoking area?",
        "What time does the match start?",
        "Is there wifi?",
        "What's the weather like?",
        "Is there an ATM nearby?",
        "Wheelchair access please",
        "Where is the info desk?",
        "There's a fire near Gate 2!",
        "Someone fainted in Section D, need medical help",
        "There's a fight in the north stand",
        "I found a suspicious bag",
        "Where is the VIP lounge?",
        "Where is the security desk?",
        "[CONTEXT_REDIRECT] Tell me about food hub status",
        "[CONTEXT_REDIRECT] Parking zone details please",
        "[CONTEXT_REDIRECT] South Stand zone info",
        "What is the capital of France?",   # out-of-domain → Gemini fallback
    ]

    print("=" * 70)
    print("  VenueFlow AI — Intent Engine Self-Test")
    print("=" * 70)

    for prompt in _TEST_PROMPTS:
        debug = get_intent_debug(prompt)
        print(f"\n[INPUT]     {prompt!r}")
        print(f"[ROUTE]     {debug['routed_to']}")
        if debug["matches"]:
            print(f"[MATCHES]   {', '.join(debug['matches'].keys())}")

    print("\n" + "=" * 70)
    print("  Venue Health Summary")
    print("=" * 70)
    try:
        summary = get_venue_health_summary()
        print(json.dumps(summary, indent=2))
    except Exception as e:
        print(f"  (Redis not available in test environment: {e})")

    print("\n" + "=" * 70)
    print("  Sample Response: 'I am hungry'")
    print("=" * 70)
    try:
        resp = chat("I am hungry", user_location="Section C", event_phase="live")
        print(resp["text"])
        print("Options:", resp["options"])
    except Exception as e:
        print(f"  (Skipped — Redis unavailable: {e})")

    print("\n" + "=" * 70)
    print("  ConversationState — Serialisation Round-Trip Test")
    print("=" * 70)
    state = ConversationState(session_id="test-session-001", event_phase="halftime")
    state.update_location("Section C, Row 12")
    state.record_turn("Where is food?", "South Hub is your best option.")
    state.record_turn("How long is the queue?", "~2 min at South Hub.")
    state.set_event_phase("live")
    print(f"  State before serialisation : {state}")
    snapshot = state.to_dict()
    restored = ConversationState.from_dict(snapshot)
    print(f"  Restored state             : {restored}")
    assert restored.session_id         == state.session_id
    assert restored.event_phase        == state.event_phase
    assert restored.turn_count         == state.turn_count
    assert restored.last_known_location == state.last_known_location
    assert len(restored.history_for_gemini()) == 4
    print("  ✅ Round-trip serialisation passed.")

    print("\n" + "=" * 70)
    print("  Rate Limiter — Token Bucket Test")
    print("=" * 70)
    guard    = _RateLimitGuard()
    session  = "rl-test-session"
    allowed  = sum(1 for _ in range(25) if guard.consume(session))
    blocked  = 25 - allowed
    print(f"  25 rapid calls → {allowed} allowed, {blocked} rate-limited.")
    assert allowed == 20, f"Expected 20 allowed, got {allowed}"
    assert blocked == 5,  f"Expected 5 blocked, got {blocked}"
    guard.reset(session)
    assert guard.consume(session), "After reset, first call should be allowed."
    print("  ✅ Rate limiter bucket test passed.")

    print("\n" + "=" * 70)
    print("  Walk-Time Utility Test")
    print("=" * 70)
    cases = [
        (70,  "~1 min"),
        (140, "~2 min"),
        (350, "~5 min"),
        (700, "~10 mins"),
    ]
    for metres, expected in cases:
        result = _walk_time(metres)
        status = "✅" if result == expected else f"❌ (got {result!r})"
        print(f"  {metres}m → {result}  {status}")

    print("\n" + "=" * 70)
    print("  All self-tests complete.")
    print("=" * 70)