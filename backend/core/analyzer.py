"""
VenueFlow AI — Crowd Routing Analyzer
Fastest-path gate assignment using a Min-Heap / Priority Queue.

Algorithm
─────────
For each gate, compute a *composite score*:

    score = (queue_length / throughput_rate) + α · distance_meters

where α is a tunable weight (default 0.05 s/m) that converts distance
into an equivalent wait-time penalty.

All scores are pushed into a **min-heap** so the optimal gate is always
at the root.

Complexity
──────────
  • heapify  : O(N)          where N = number of gates
  • pop best : O(log N)
  • K users  : O(K · log N)  amortised with re-heapify after updates

Space: O(N) for the heap.
"""

import heapq
from typing import List, Optional, Tuple

from core.models import Gate, RouteRecommendation


# ── Tuning constants ─────────────────────────────────────────
DISTANCE_WEIGHT: float = 0.05     # seconds-per-metre penalty
CLOSED_GATE_PENALTY: float = 1e9  # effectively infinite
PHASE_BONUS_FACTOR: float = 0.75   # 25% discount for high-throughput during exodus
PHASE_PENALTY_FACTOR: float = 1.15  # 15% surcharge for small gates at peak arrival


def _composite_score(gate: Gate, distance_m: float, event_phase: str = "Normal", look_ahead_minutes: float = 0.0) -> tuple[float, float]:
    """
    Compute the routing score for a single gate.

    Lower is better.
    Returns (score, predicted_wait_seconds).
    Returns a very large number for closed gates so they sink in the heap.
    """
    if not gate.is_open or gate.throughput_rate <= 0:
        return CLOSED_GATE_PENALTY, float("inf")

    # Calculate look_ahead_buffer dynamically using estimated walking time
    walking_speed_mps = 1.4  # average walking speed in meters per second
    time_to_arrive_sec = distance_m / walking_speed_mps
    total_look_ahead_sec = time_to_arrive_sec + (look_ahead_minutes * 60)
    
    # Predict queue size when user arrives (queue drains at throughput rate)
    projected_queue = max(0, gate.current_queue - (gate.throughput_rate * total_look_ahead_sec))
    wait = projected_queue / gate.throughput_rate
    
    base_score = wait + (DISTANCE_WEIGHT * distance_m)

    # Event Phase Multipliers (Venue Momentum)
    if ("Exodus" in event_phase or "Critical" in event_phase) and gate.throughput_rate > 2.0:
        score = base_score * PHASE_BONUS_FACTOR
    elif "Arrival" in event_phase and gate.throughput_rate < 2.0:
        score = base_score * PHASE_PENALTY_FACTOR
    else:
        score = base_score

    return score, wait


def find_fastest_gate(
    gates: List[Gate],
    user_distances: dict[str, float],   # gate_id → metres
    top_k: int = 1,
    event_phase: str = "Normal",
    look_ahead_minutes: float = 0.0,
) -> List[RouteRecommendation]:
    """
    Return the *top_k* best gates for the user, ordered best-first.

    Parameters
    ----------
    gates : list[Gate]
        All gates at the venue.
    user_distances : dict[str, float]
        Mapping of gate_id → straight-line distance (metres) from the user.
    top_k : int
        How many recommendations to return (default 1 = single best).
    event_phase: str
        The current active event phase sent by the simulator.
    look_ahead_minutes: float
        Number of minutes to project into the future for queue estimation.

    Returns
    -------
    list[RouteRecommendation]
        Sorted best → worst by composite score.

    Complexity
    ----------
    Time  : O(N + top_k · log N)
    Space : O(N)
    """
    # Sanity check: ensure throughput_rate is in people/second (expected range 0-15)
    assert all(0 <= g.throughput_rate < 15 for g in gates if g.is_open), \
        "throughput_rate out of range (0-15 people/sec). Check if units are mistakenly people/minute."

    # Build scored entries: (score, index_tiebreaker, gate, distance)
    heap: List[Tuple[float, int, Gate, float, float]] = []
    for idx, gate in enumerate(gates):
        dist = user_distances.get(gate.gate_id, 0.0)
        score, pred_wait = _composite_score(gate, dist, event_phase=event_phase, look_ahead_minutes=look_ahead_minutes)
        heapq.heappush(heap, (score, idx, gate, dist, pred_wait))

    # Pop top-k in O(top_k · log N)
    results: List[RouteRecommendation] = []
    for _ in range(min(top_k, len(heap))):
        score, _, gate, dist, pred_wait = heapq.heappop(heap)
        if score >= CLOSED_GATE_PENALTY:
            break  # no more viable gates
        results.append(
            RouteRecommendation(
                gate=gate,
                estimated_wait_seconds=gate.estimated_wait_seconds,
                predicted_wait_seconds=pred_wait,
                distance_meters=dist,
                composite_score=round(score, 2),
            )
        )

    return results


def rebalance_crowd(
    gates: List[Gate],
    total_incoming: int,
) -> dict[str, int]:
    """
    Distribute *total_incoming* attendees across open gates to
    minimise the maximum wait time (load-balancing).

    Uses a min-heap keyed by estimated_wait; pops the lightest gate,
    assigns one person, recalculates, and pushes back.
    """
    # Sanity check: ensure throughput_rate is in people/second (expected range 0-15)
    assert all(0 <= g.throughput_rate < 15 for g in gates if g.is_open), \
        "throughput_rate out of range (0-15 people/sec). Check if units are mistakenly people/minute."

    assignments: dict[str, int] = {g.gate_id: 0 for g in gates}
    # Shadow state — never touch the real Gate objects
    queue_shadow: dict[str, float] = {g.gate_id: g.current_queue for g in gates}
    rate_map: dict[str, float] = {g.gate_id: g.throughput_rate for g in gates}

    # (initial_wait, tiebreaker, gate_id)
    heap = [
        (g.estimated_wait_seconds, i, g.gate_id)
        for i, g in enumerate(gates)
        if g.is_open
    ]
    heapq.heapify(heap)

    counter = len(gates)  # tiebreaker counter

    for _ in range(total_incoming):
        if not heap:
            break
        _, _, gate_id = heapq.heappop(heap)
        assignments[gate_id] += 1
        queue_shadow[gate_id] += 1
        
        # Recompute wait from shadow, not from the live model
        new_wait = queue_shadow[gate_id] / rate_map[gate_id] if rate_map[gate_id] > 0 else float('inf')
        counter += 1
        heapq.heappush(heap, (new_wait, counter, gate_id))

    return assignments
