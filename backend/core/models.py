"""
VenueFlow AI — Domain Models
Pure data structures representing venue entities.
"""

from dataclasses import dataclass, field
from typing import Optional
import time


@dataclass
class Gate:
    """Represents a physical entry/exit gate at the venue."""
    gate_id: str
    name: str
    zone: str
    latitude: float
    longitude: float
    capacity: int              # max throughput per minute
    level: int = 1             # Floor level
    current_queue: int = 0     # people currently in line
    throughput_rate: float = 1.0  # ALWAYS people/second (e.g., 2.5). 
                                  # If stored as people/min, divide by 60.0.
    is_open: bool = True

    @property
    def estimated_wait_seconds(self) -> float:
        """Raw wait estimate based on queue / throughput."""
        if self.throughput_rate <= 0 or not self.is_open:
            return float("inf")
        return self.current_queue / self.throughput_rate


@dataclass
class Zone:
    """A logical zone inside the venue (e.g. North Stand, Food Court)."""
    zone_id: str
    name: str
    capacity: int
    latitude: float
    longitude: float
    level: int = 1
    current_occupancy: int = 0
    peak_occupancy: int = 0

    @property
    def density(self) -> float:
        """Occupancy ratio 0.0 – 1.0."""
        return self.current_occupancy / max(self.capacity, 1)

    @property
    def status(self) -> str:
        d = self.density
        if d < 0.5:
            return "low"
        elif d < 0.8:
            return "moderate"
        elif d < 0.95:
            return "high"
        return "critical"


@dataclass
class SensorReading:
    """A single reading from a crowd-density sensor."""
    sensor_id: str
    zone_id: str
    timestamp: float = field(default_factory=time.time)
    person_count: int = 0
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None


@dataclass
class RouteRecommendation:
    """Result of the fastest-path algorithm."""
    gate: Gate
    estimated_wait_seconds: float
    predicted_wait_seconds: float
    distance_meters: float
    composite_score: float  # lower is better
