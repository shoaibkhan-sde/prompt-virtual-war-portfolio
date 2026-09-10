import pytest
import json
from app import create_app

@pytest.fixture
def app():
    app = create_app(testing=True)
    return app

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_list_gates(client):
    response = client.get('/api/gates')
    assert response.status_code == 200
    assert 'gates' in response.json
    assert len(response.json['gates']) > 0

def test_optimal_gate_invalid_params(client):
    response = client.get('/api/gates/optimal?lat=abc')
    assert response.status_code == 400

def test_optimal_gate_missing_coords(client):
    """Verify that omitting lat/lon is allowed and returns best-by-queue."""
    response = client.get('/api/gates/optimal?top_k=5')
    assert response.status_code == 200
    assert len(response.json) > 0

def test_unauthorized_access(client):
    """Verify that protected routes rejected unauthorized requests."""
    response = client.get('/api/auth/verify')
    assert response.status_code == 401
    assert "Token is missing" in response.json['error']

def test_pydantic_validation_chat(client):
    """Verify that the centralized validation layer catches invalid inputs."""
    # Chat expects "message", we send empty body
    response = client.post('/api/chat', json={})
    assert response.status_code == 400
    assert "Invalid input" in response.json['error']
