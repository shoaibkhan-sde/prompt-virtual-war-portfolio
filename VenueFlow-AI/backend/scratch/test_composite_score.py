import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from core.models import Gate
from core.analyzer import _composite_score, PHASE_BONUS_FACTOR, PHASE_PENALTY_FACTOR

def test_scoring():
    # Mock a high-throughput gate
    large_gate = Gate(
        gate_id="G1",
        name="Main Entrance",
        zone="A",
        capacity=200,
        is_open=True,
        current_queue=50,
        throughput_rate=3.0, # High throughput
        latitude=0.0,
        longitude=0.0
    )
    
    # Mock a low-throughput gate
    small_gate = Gate(
        gate_id="G2",
        name="Side Gate",
        zone="B",
        capacity=50,
        is_open=True,
        current_queue=10,
        throughput_rate=1.0, # Low throughput
        latitude=0.0,
        longitude=0.0
    )
    
    distance = 100.0 # 100 meters
    
    print("--- Test: Normal Phase ---")
    score_normal, _ = _composite_score(large_gate, distance, "Normal")
    print(f"Large Gate (Normal): {score_normal:.2f}")
    
    print("\n--- Test: Exodus Phase (Bonus for Large Gates) ---")
    score_exodus, _ = _composite_score(large_gate, distance, "Exodus")
    print(f"Large Gate (Exodus): {score_exodus:.2f} (Expected: {score_normal * PHASE_BONUS_FACTOR:.2f})")
    assert round(score_exodus, 4) == round(score_normal * PHASE_BONUS_FACTOR, 4)
    
    print("\n--- Test: Arrival Phase (Penalty for Small Gates) ---")
    score_small_normal, _ = _composite_score(small_gate, distance, "Normal")
    score_small_arrival, _ = _composite_score(small_gate, distance, "Arrival")
    print(f"Small Gate (Normal): {score_small_normal:.2f}")
    print(f"Small Gate (Arrival): {score_small_arrival:.2f} (Expected: {score_small_normal * PHASE_PENALTY_FACTOR:.2f})")
    assert round(score_small_arrival, 4) == round(score_small_normal * PHASE_PENALTY_FACTOR, 4)

    print("\n--- Test: No Negative Scores ---")
    # Even with very small wait and distance, score should be >= 0
    tiny_gate = Gate(
        gate_id="T1",
        name="Tiny",
        zone="C",
        capacity=100,
        is_open=True,
        current_queue=0,
        throughput_rate=5.0,
        latitude=0,
        longitude=0
    )
    score_tiny, _ = _composite_score(tiny_gate, 0.1, "Exodus")
    print(f"Tiny Gate (Exodus): {score_tiny:.4f}")
    assert score_tiny >= 0

if __name__ == "__main__":
    try:
        test_scoring()
        print("\nALL SCORING TESTS PASSED!")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
