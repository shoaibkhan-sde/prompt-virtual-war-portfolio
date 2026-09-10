
import math
from typing import Tuple

_R = 6_371_000

def haversine(
    coord1: Tuple[float, float],
    coord2: Tuple[float, float],
) -> float:
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return _R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def test_repro():
    try:
        # Simulate the error
        # The error is "float() argument must be a string or a real number, not 'tuple'"
        print("Testing float((1,2))...")
        float((1,2))
    except Exception as e:
        print(f"Caught expected error: {e}")

    try:
        # Let's see if googlemaps library (mocked) might be doing something
        # origins = [{"lat": 23.0, "lng": 72.0}]
        # What if user_lat was passed as a tuple?
        user_lat = (23.0,)
        print(f"Testing float on tuple {user_lat}...")
        float(user_lat)
    except Exception as e:
        print(f"Caught error on tuple: {e}")

if __name__ == "__main__":
    test_repro()
