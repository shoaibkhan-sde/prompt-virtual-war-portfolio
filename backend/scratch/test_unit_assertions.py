import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from core.models import Gate
from core.analyzer import find_fastest_gate, rebalance_crowd

def test_unit_assertions():
    # Valid gate (people/sec)
    valid_gate = Gate(
        gate_id="G1", name="Main", zone="A", capacity=100, 
        is_open=True, current_queue=10, throughput_rate=1.5, # Valid
        latitude=0, longitude=0
    )
    
    # Invalid gate (likely people/min)
    invalid_gate = Gate(
        gate_id="G2", name="Side", zone="B", capacity=100, 
        is_open=True, current_queue=10, throughput_rate=90.0, # 90 people/sec is impossible
        latitude=0, longitude=0
    )
    
    print("--- Test: Valid Units ---")
    try:
        find_fastest_gate([valid_gate], {"G1": 10.0})
        rebalance_crowd([valid_gate], 10)
        print("SUCCESS: Valid units accepted.")
    except AssertionError as e:
        print(f"FAILURE: Unexpected assertion error: {e}")
        
    print("\n--- Test: Invalid Units (people/min mistakenly passed) ---")
    try:
        find_fastest_gate([invalid_gate], {"G2": 10.0})
        print("FAILURE: Should have raised AssertionError for 90 people/sec")
    except AssertionError as e:
        print(f"SUCCESS: Correctly caught invalid unit: {e}")

    try:
        rebalance_crowd([invalid_gate], 10)
        print("FAILURE: Should have raised AssertionError for 90 people/sec")
    except AssertionError as e:
        print(f"SUCCESS: Correctly caught invalid unit in rebalance_crowd: {e}")

if __name__ == "__main__":
    test_unit_assertions()
