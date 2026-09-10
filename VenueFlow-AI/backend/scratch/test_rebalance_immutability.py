import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from core.models import Gate
from core.analyzer import rebalance_crowd

def test_immutability():
    gates = [
        Gate(gate_id="G1", name="Gate 1", zone="A", capacity=100, is_open=True, current_queue=10, throughput_rate=1.0, latitude=0, longitude=0),
        Gate(gate_id="G2", name="Gate 2", zone="B", capacity=100, is_open=True, current_queue=10, throughput_rate=2.0, latitude=0, longitude=0),
    ]
    
    # Store original values
    original_queues = {g.gate_id: g.current_queue for g in gates}
    
    total_incoming = 50
    print(f"--- Running rebalance_crowd with {total_incoming} people ---")
    assignments = rebalance_crowd(gates, total_incoming)
    
    print("Assignments:", assignments)
    
    # Check for mutations
    mutated = False
    for g in gates:
        print(f"Gate {g.gate_id}: Original={original_queues[g.gate_id]}, Current={g.current_queue}")
        if g.current_queue != original_queues[g.gate_id]:
            mutated = True
            
    if not mutated:
        print("SUCCESS: Input Gate objects were NOT mutated.")
    else:
        print("FAILURE: Input Gate objects WERE mutated!")
        sys.exit(1)
        
    # Basic logic check: G2 has higher throughput, so it should get more people
    if assignments["G2"] > assignments["G1"]:
        print("SUCCESS: Load balancing logic correctly favored higher throughput gate.")
    else:
        print("FAILURE: Load balancing logic did not favor higher throughput gate.")
        sys.exit(1)

if __name__ == "__main__":
    test_immutability()
