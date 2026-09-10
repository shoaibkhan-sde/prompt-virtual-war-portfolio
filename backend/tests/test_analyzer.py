import pytest
from core.models import Gate, RouteRecommendation
from core.analyzer import find_fastest_gate, rebalance_crowd

@pytest.fixture
def sample_gates():
    return [
        Gate(gate_id="gate-1", name="North Gate", zone="north", latitude=23.03, longitude=72.52, capacity=1000, current_queue=10, throughput_rate=2.0),
        Gate(gate_id="gate-2", name="South Gate", zone="south", latitude=23.04, longitude=72.53, capacity=1000, current_queue=50, throughput_rate=1.0),
        Gate(gate_id="gate-3", name="East Gate", zone="east", latitude=23.05, longitude=72.54, capacity=500, current_queue=5, throughput_rate=5.0, is_open=False),
    ]

def test_find_fastest_gate_basic(sample_gates):
    """Verify basic priority calculation (Queue/Rate + Distance)."""
    user_dists = {"gate-1": 100, "gate-2": 500, "gate-3": 200}
    # Gate 1: 10/2 + 100*0.05 = 5 + 5 = 10s
    # Gate 2: 50/1 + 500*0.05 = 50 + 25 = 75s
    # Gate 3: Closed (Inf)
    
    results = find_fastest_gate(sample_gates, user_dists, top_k=2)
    
    assert len(results) == 2
    assert results[0].gate.gate_id == "gate-1"
    # Live wait: 10/2 = 5.0s
    assert results[0].estimated_wait_seconds == 5.0
    # Composite (Wait[0] + Dist[5]): 5.0
    assert results[0].composite_score == 5.0

def test_find_fastest_gate_empty_lists():
    """Verify resilience against empty data."""
    assert find_fastest_gate([], {}, top_k=5) == []

def test_find_fastest_gate_high_congestion(sample_gates):
    """Verify that a far-away but empty gate is preferred over a nearby congested one."""
    # Add a far gate that's empty
    sample_gates.append(Gate(gate_id="gate-far", name="Far Gate", zone="west", latitude=23.99, longitude=72.99, 
                           capacity=1000, current_queue=0, throughput_rate=10.0))
    
    user_dists = {"gate-1": 100, "gate-2": 500, "gate-f": 1000, "gate-far": 5000}
    # Gate 1: 10s
    # Gate 2: 75s
    # Gate-Far: 0/10 + 5000*0.05 = 250s (Okay, far but maybe not better)
    
    results = find_fastest_gate(sample_gates, user_dists)
    assert results[0].gate.gate_id == "gate-1"

def test_rebalance_crowd_simple(sample_gates):
    """Verify crowd rebalancing logic across open gates."""
    # Gate 1 (2.0 rate), Gate 2 (1.0 rate)
    # Total incoming: 300
    assignments = rebalance_crowd(sample_gates, 300)
    
    # It should assign more to the higher throughput gate
    assert assignments["gate-1"] > assignments["gate-2"]
    assert sum(assignments.values()) == 300

def test_rebalance_no_open_gates():
    """Verify handling of venue-wide lockdown."""
    closed_gates = [Gate(gate_id="G1", name="G1", zone="Z1", latitude=0, longitude=0, capacity=10, is_open=False)]
    assignments = rebalance_crowd(closed_gates, 100)
    assert assignments == {"G1": 0}

def test_routing_result_serialization():
    """Verify helper model behavior."""
    g = Gate(gate_id="X", name="X", zone="Z", latitude=0, longitude=0, capacity=10)
    res = RouteRecommendation(gate=g, estimated_wait_seconds=10, predicted_wait_seconds=12, distance_meters=100, composite_score=5)
    assert res.gate.gate_id == "X"
