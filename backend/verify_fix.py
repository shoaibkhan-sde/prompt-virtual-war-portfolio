
from services.maps_service import distances_to_gates
from core.models import Gate

def test_fix():
    print("Testing maps_service fix with potential tuple data...")
    
    # Mock some gates with weird data if possible, though models should prevent it
    # We'll test with the real function and see if it handles the 'tuple' case
    
    gates = [
        Gate("gate-1", "Test Gate", "zone-1", 23.0335, 72.5265, capacity=500)
    ]
    
    try:
        # Try passing a tuple as lat to simulate the error condition
        dists = distances_to_gates((23.0312,), 72.5260, gates)
        print(f"Success! Calculated distances: {dists}")
    except Exception as e:
        print(f"Failed! Still getting error: {e}")

if __name__ == "__main__":
    test_fix()
