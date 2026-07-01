def test_health_contract(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["embedding_model"]
    assert body["embedding_backend"]
    assert body["memory_profile"] in {"render-512-safe", "semantic-full"}
    assert body["fast_model"]
    assert body["fast_provider"] == "groq"
    assert body["thinking_model"]
    assert body["thinking_provider"] in {"groq", "anthropic"}
    assert response.headers["x-request-id"]


def test_api_health_matches_frontend_rewrite_path(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
