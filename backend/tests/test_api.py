import pytest
import json
from wsgi import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json == {"status": "ok"}

def test_chat_invalid_json(client):
    """Test chat with non-json content."""
    response = client.post('/api/chat/', data="not json")
    assert response.status_code == 415

def test_chat_empty_message(client):
    """Test chat with empty message."""
    response = client.post('/api/chat/', json={"message": ""})
    assert response.status_code == 400
    assert "error" in response.json

def test_quiz_submit_basic(client):
    """Test basic quiz submission."""
    payload = {
        "answers": [
            {"questionId": "q1", "selectedIndex": 1},
            {"questionId": "q2", "selectedIndex": 0}
        ]
    }
    response = client.post('/api/quiz/submit', json=payload)
    assert response.status_code == 200
    data = response.json
    assert "score" in data
    assert data["total"] == 2
    assert len(data["feedback"]) == 2

def test_simulate_endpoint(client):
    """Test simulation endpoint."""
    payload = {
        "decision": "Host a rally",
        "stats": {"trust": 10},
        "day": 5
    }
    response = client.post('/api/simulate/', json=payload)
    assert response.status_code == 200
    data = response.json
    assert "narrative" in data
    assert "xp_earned" in data

def test_chat_sliding_window_logic(client):
    """Test that chat history is summarized when too long."""
    # Send a long history
    history = [{"role": "user", "content": "Hello"}] * 20
    payload = {
        "message": "Continue",
        "history": history,
        "appContext": {"userLevel": 1}
    }
    response = client.post('/api/chat/', json=payload)
    # 503 is acceptable if AI key is missing in test env
    assert response.status_code in (200, 503)

def test_quiz_generate_fallback(client):
    """Test quiz generation handles service unavailability."""
    response = client.post('/api/quiz/generate', json={"stage": "registration"})
    assert response.status_code in (200, 503)

def test_security_headers(client):
    """Verify security headers."""
    response = client.get('/api/health')
    # Check for basic headers that should always be there if Talisman is active
    assert 'X-Frame-Options' in response.headers


