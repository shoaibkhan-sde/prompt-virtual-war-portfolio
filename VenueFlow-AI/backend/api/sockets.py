# backend/api/sockets.py
"""
VenueFlow AI — WebSocket Event Handlers
Manages real-time message exchange and conversational context.
"""

from flask_socketio import emit
from flask import request
from extensions import socketio

# Per-session conversation history keyed by socket session ID
# { sid: [{"role": "user"|"assistant", "content": "..."}] }
_session_histories: dict[str, list[dict]] = {}
MAX_HISTORY = 5


def _get_history(sid: str) -> list[dict]:
    """Return history list for this socket session, creating if needed."""
    if sid not in _session_histories:
        _session_histories[sid] = []
    # Safeguard against accidental None or wrong type
    if not isinstance(_session_histories[sid], list):
        _session_histories[sid] = []
    return _session_histories[sid]


@socketio.on('connect')
def handle_connect():
    _session_histories[request.sid] = []   # fresh history for this client
    # Clean logging: silent in production to prevent terminal-encoding crashes


@socketio.on('disconnect')
def handle_disconnect():
    _session_histories.pop(request.sid, None)  # clean up on disconnect


@socketio.on('chat_message')
def handle_chat(data):
    # Robust imports to ensure no hanging or circular dep issues in production
    import services.gemini_service as gemini_service
    from services.redis_service import get_all_zones, get_all_gates
    from services.alert_service import get_recent_alerts

    msg = data.get("message", "").strip()
    if not msg:
        return

    try:
        zones = get_all_zones()
        gates = get_all_gates()

        # ── Build rich real-time context ──────────────────────────
        zone_lines = "\n".join(
            f"  • {z.name}: {z.current_occupancy:,}/{z.capacity:,} "
            f"({z.status} — {z.density * 100:.0f}%)"
            for z in zones
        )
        gate_lines = "\n".join(
            f"  • {g.name} [{g.zone}]: queue={g.current_queue}, "
            f"wait={g.estimated_wait_seconds:.0f}sec, "
            f"{'OPEN' if g.is_open else 'CLOSED'}"
            for g in gates
        )

        # 🛰️ Integration: Pull live alerts from the new Redis-backed Alert Service
        try:
            recent_alerts = get_recent_alerts()[:5]  # Take top 5 for LLM context
            alert_lines = "\n".join(
                f"  [{a['level'].upper()}] {a['title']}: {a['message']}"
                for a in recent_alerts
            ) or "  None — all systems nominal."
        except Exception:
            alert_lines = "  Data currently unavailable."

        # ── Per-session history ───────────────────────────────────
        history = _get_history(request.sid)
        history.append({"role": "user", "text": msg})

        # Keep history bounded (sliding window)
        if len(history) > MAX_HISTORY * 2:
            history.pop(0)

        # Build history string for the LLM
        history_text = "\n".join(
            f"{'Fan' if h['role'] == 'user' else 'Assistant'}: {h['text']}"
            for h in history[:-1]   # exclude the current message
        )

        context = (
            f"[Live Zone Occupancy]\n{zone_lines}\n\n"
            f"[Live Gate Status]\n{gate_lines}\n\n"
            f"[Recent Alerts]\n{alert_lines}"
        )

        if history_text:
            context += f"\n\n[Conversation History]\n{history_text}"

        # ── Call Intelligence Hub ─────────────────────────────────
        reply_data = gemini_service.chat(msg, context=context)

        # Update history with the result
        history.append({"role": "assistant", "text": reply_data.get("text", "")})

        # Final broadcast back to the specific client
        emit("chat_reply", reply_data)

    except Exception:
        # Avoid printing 'e' because it may contain emojis/Unicode that crash Windows terminals
        emit("chat_reply", {
            "text": "⚠️ Assistant is busy re-evaluating venue metrics. "
                    "Please try again in a moment.",
            "options": ["🍔 Food", "🚪 Gates", "📍 Map"]
        })