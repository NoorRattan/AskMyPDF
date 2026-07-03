def test_health_contract(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body == {"status": "ok", "model_loaded": True}
    assert response.headers["x-request-id"]


def test_api_health_matches_frontend_rewrite_path(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["embedding_model"]
    assert body["embedding_backend"]
    assert body["memory_profile"] in {"render-512-safe", "semantic-full"}
    assert body["offline_model"] == "askmypdf-offline-extractive-v1"
    assert body["offline_provider"] == "local"
    assert body["fast_model"]
    assert body["fast_provider"] == "groq"
    assert body["thinking_model"]
    assert body["thinking_provider"] in {"groq", "anthropic"}
    assert {model["id"] for model in body["available_models"]} == {"offline", "fast", "thinking"}
    assert next(model for model in body["available_models"] if model["id"] == "offline")["available"] is True


def test_api_docs_are_not_exposed_by_default(client):
    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    assert client.get("/openapi.json").status_code == 404
