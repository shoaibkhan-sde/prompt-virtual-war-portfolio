import os
import sys

# Add the project root to sys.path so we can import 'backend'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from services.maps_service import distances_to_gates

class MockGate:
    def __init__(self, gate_id, latitude, longitude):
        self.gate_id = gate_id
        self.latitude = latitude
        self.longitude = longitude

# Test cases for "dirty" data
gates = [
    MockGate("G1", "12.345", "78.901"),  # Strings
    MockGate("G2", 12.346, 78.902),    # Correct floats
]

print("--- Test: Boundary Coercion ---")
try:
    # Passing strings for user_lat/lon as well
    results = distances_to_gates("12.344", "78.900", gates)
    print("Results:", results)
    print("SUCCESS: Boundary coercion handled dirty data without safe_float internal helper.")
except Exception as e:
    print(f"FAILURE: {e}")

# Test for failure if data is truly invalid (should raise error now, which is better than silent failure)
print("\n--- Test: Invalid Data Failure ---")
try:
    invalid_gates = [MockGate("GX", "not-a-float", "78.901")]
    distances_to_gates(12.344, 78.900, invalid_gates)
    print("FAILURE: Should have raised ValueError for 'not-a-float'")
except ValueError:
    print("SUCCESS: Correctly raised ValueError for completely invalid data.")
except Exception as e:
    print(f"FAILED with unexpected exception: {e}")
