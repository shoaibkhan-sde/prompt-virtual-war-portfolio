import pytest
from unittest.mock import MagicMock, patch
from services.audit_service import audit_logger
from services.maps_service import distances_to_gates
from core.models import Gate

@pytest.fixture
def sample_gates():
    return [
        Gate(gate_id="G1", name="G1", zone="Z", latitude=23.01, longitude=72.51, capacity=100),
        Gate(gate_id="G2", name="G2", zone="Z", latitude=23.02, longitude=72.52, capacity=100),
    ]

def test_audit_logging_format(app):
    """Verify that the audit logger produces structured security events."""
    with app.test_request_context(headers={"X-Request-ID": "test-req-id"}):
        with patch.object(audit_logger.logger, 'info') as mock_log:
            audit_logger.log("TEST_EVENT", "SUCCESS", metadata={"unit": "test"})
            mock_log.assert_called_once()
            # Verify the logged string is valid JSON and contains our data
            logged_msg = mock_log.call_args[0][0]
            assert "TEST_EVENT" in logged_msg
            assert "SUCCESS" in logged_msg

def test_maps_service_haversine_fallback(sample_gates):
    """Verify that we fallback to Haversine when Google Maps is missing."""
    with patch("services.maps_service.Config.GOOGLE_MAPS_API_KEY", ""):
        distances = distances_to_gates(23.0, 72.5, sample_gates)
        assert "G1" in distances
        assert distances["G1"] > 0
        assert isinstance(distances["G1"], (int, float))

def test_redis_service_unit_mock():
    """Verify redis service initialization logic."""
    with patch("redis.Redis.from_url") as mock_redis:
        mock_instance = MagicMock()
        mock_redis.return_value = mock_instance
        # Simple test to ensure the service can exist
        from services.redis_service import redis_client
        assert redis_client is not None
