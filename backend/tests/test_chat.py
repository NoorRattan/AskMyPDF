import json

from app.config import settings
from app.services.llm_service import resolve_model


def _upload(client, sample_pdf) -> str:
    with sample_pdf.open("rb") as file:
        response = client.post(
            "/api/upload",
            files={"file": ("sample.pdf", file, "application/pdf")},
        )
    assert response.status_code == 200
    status = client.get(f"/api/upload/status/{response.json()['job_id']}")
    assert status.status_code == 200
    body = status.json()
    assert body["status"] == "ready"
    return body["session_id"]


def _sse_messages(text: str) -> list[dict]:
    messages = []
    for line in text.splitlines():
        if line.startswith("data: "):
            messages.append(json.loads(line.removeprefix("data: ")))
    return messages


def test_chat_happy_path(client, sample_pdf, mock_llm):
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={"session_id": session_id, "question": "What is this document about?"},
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    messages = _sse_messages(body)
    token_messages = [message for message in messages if "token" in message]
    done_messages = [message for message in messages if message.get("done") is True]
    assert token_messages
    assert len(done_messages) == 1
    assert done_messages[0]["sources"]
    assert done_messages[0]["model_used"] == settings.fast_model
    assert done_messages[0]["provider_used"] == settings.fast_model_provider


def test_chat_thinking_model(client, sample_pdf, monkeypatch):
    seen = {}

    async def fake_stream(question: str, chunks: list[dict], model_preference: str = "fast"):
        seen["model_preference"] = model_preference
        yield "Thinking answer."

    monkeypatch.setattr("app.routers.chat.stream_answer", fake_stream)
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={
            "session_id": session_id,
            "question": "Compare the methodology and findings.",
            "model_preference": "thinking",
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    messages = _sse_messages(body)
    done_messages = [message for message in messages if message.get("done") is True]
    assert seen["model_preference"] == "thinking"
    assert done_messages[0]["model_used"] == settings.thinking_model
    assert done_messages[0]["provider_used"] == settings.thinking_model_provider


def test_chat_fast_falls_back_to_anthropic_without_groq_key(client, sample_pdf, monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", None)

    async def fake_stream(question: str, chunks: list[dict], model_preference: str = "fast"):
        yield "Fallback answer."

    monkeypatch.setattr("app.routers.chat.stream_answer", fake_stream)
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={
            "session_id": session_id,
            "question": "What is this document about?",
            "model_preference": "fast",
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    messages = _sse_messages(body)
    done_messages = [message for message in messages if message.get("done") is True]
    assert resolve_model("fast").fell_back is True
    assert done_messages[0]["model_used"] == settings.thinking_model
    assert done_messages[0]["provider_used"] == settings.thinking_model_provider


def test_chat_unknown_session_id(client):
    response = client.post(
        "/api/chat",
        json={"session_id": "abcdef1234567890", "question": "What is this?"},
    )

    assert response.status_code == 404
    assert response.json()["error"] == "session_not_found"


def test_chat_invalid_session_id_format(client):
    response = client.post(
        "/api/chat",
        json={"session_id": "not-valid", "question": "What is this?"},
    )

    assert response.status_code == 422


def test_chat_question_over_1000_chars(client):
    response = client.post(
        "/api/chat",
        json={"session_id": "abcdef1234567890", "question": "x" * 1001},
    )

    assert response.status_code == 422


def test_chat_invalid_model_preference(client):
    response = client.post(
        "/api/chat",
        json={
            "session_id": "abcdef1234567890",
            "question": "What is this?",
            "model_preference": "auto",
        },
    )

    assert response.status_code == 422
