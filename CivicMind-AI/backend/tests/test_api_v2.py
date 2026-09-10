import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test the health check endpoint returns 200 OK."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json == {"status": "ok"}

def test_404_api_json(client):
    """Test that non-existent API endpoints return a standardized JSON error."""
    response = client.get('/api/non-existent-endpoint')
    assert response.status_code == 404
    assert "error" in response.json
    assert response.json["code"] == "NOT_FOUND"

def test_404_frontend_fallback(client):
    """Test that non-API 404s fallback to index.html for React routing."""
    response = client.get('/random-page')
    assert response.status_code == 200
    assert b"doctype html" in response.data.lower()

def test_chat_validation_error(client):
    """Test that chat endpoint handles missing data with standard error."""
    response = client.post('/api/chat/', json={})
    # Should fail with 400 or 500 depending on implementation
    assert response.status_code in [400, 500]
    assert "error" in response.json
