"""
VenueFlow AI — Maps Service
"""

import math
import googlemaps
from cachetools import TTLCache, cached
from cachetools.keys import hashkey
from typing import Tuple
from config import Config

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


_distance_cache = TTLCache(maxsize=256, ttl=30)  # 30-second TTL


@cached(_distance_cache, key=lambda user_lat, user_lon, gate_coords: hashkey(
    round(user_lat, 4),  # ~11m precision bucket
    round(user_lon, 4),
    gate_coords
))
def _fetch_batch_matrix(
    user_lat: float,
    user_lon: float,
    gate_coords: Tuple[Tuple[float, float], ...]
) -> list:
    """Fetch all distances in a single API call and cache the results."""
    try:
        user_coords = (user_lat, user_lon)

        if not Config.GOOGLE_MAPS_API_KEY:
            return [haversine(user_coords, gc) for gc in gate_coords]

        gmaps = googlemaps.Client(key=Config.GOOGLE_MAPS_API_KEY)

        # Origins and destinations are guaranteed to be clean floats
        origins = [{"lat": user_lat, "lng": user_lon}]
        destinations = [{"lat": gc[0], "lng": gc[1]} for gc in gate_coords]

        matrix = gmaps.distance_matrix(
            origins,
            destinations,
            mode="walking"
        )

        distances = []
        elements = matrix.get("rows", [{}])[0].get("elements", [])
        for i, elem in enumerate(elements):
            if elem.get("status") == "OK":
                val = elem.get("distance", {}).get("value")
                distances.append(float(val) if val is not None else haversine(user_coords, gate_coords[i]))
            else:
                distances.append(haversine(user_coords, gate_coords[i]))
        return distances

    except Exception as e:
        print(f"[ERROR] Google Maps API failed: {e}")
        print(f"   DEBUG: user_lat={user_lat} ({type(user_lat)}), user_lon={user_lon} ({type(user_lon)})")
        # Detailed gate_coords check if it's the culprit
        if gate_coords and len(gate_coords) > 0:
             print(f"   DEBUG: first gate_coord={gate_coords[0]} (types: {[type(x) for x in gate_coords[0]]})")
        
        return [haversine(user_coords, gc) for gc in gate_coords]


def distances_to_gates(
    user_lat: float,
    user_lon: float,
    gates: list,
) -> dict[str, float]:
    """Compute distance from user to every gate using a single cached batch request."""
    # Enforce types at the boundary - hardened to handle tuples/lists
    def _safe_float(val):
        if isinstance(val, (list, tuple)):
            return float(val[0])
        return float(val)

    user_lat = _safe_float(user_lat)
    user_lon = _safe_float(user_lon)
    gate_coords = tuple((float(g.latitude), float(g.longitude)) for g in gates)

    dist_list = _fetch_batch_matrix(user_lat, user_lon, gate_coords)
    return {
        g.gate_id: round(dist_list[i], 1)
        for i, g in enumerate(gates)
    }