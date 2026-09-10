import time
from cachetools import TTLCache, cached
from cachetools.keys import hashkey

# Mocking the cache and hashkey logic from maps_service.py
_distance_cache = TTLCache(maxsize=256, ttl=1) # 1-second TTL for testing

@cached(_distance_cache, key=lambda user_lat, user_lon, gate_coords: hashkey(
    round(user_lat, 4),
    round(user_lon, 4),
    gate_coords
))
def test_fetch(user_lat, user_lon, gate_coords):
    print(f"Executing for {user_lat}, {user_lon}")
    return "result"

# Test cases
gc = ((1.0, 1.0),)

print("--- Test 1: First call ---")
test_fetch(12.34567, 78.90123, gc)

print("--- Test 2: Same coordinates (rounded) ---")
test_fetch(12.34568, 78.90124, gc) # Should be cached

print("--- Test 3: Different coordinates ---")
test_fetch(12.35, 78.91, gc) # Should execute

print("--- Test 4: Wait for TTL ---")
time.sleep(1.1)
test_fetch(12.34567, 78.90123, gc) # Should execute again
