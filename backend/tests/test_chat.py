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


def _done_message(body: str) -> dict:
    done_messages = [message for message in _sse_messages(body) if message.get("done") is True]
    assert len(done_messages) == 1
    return done_messages[0]


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
    assert token_messages
    done = _done_message(body)
    assert done["sources"]
    assert done["model_used"] == settings.fast_model
    assert done["provider_used"] == settings.fast_model_provider


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
    done = _done_message(body)
    assert seen["model_preference"] == "thinking"
    assert done["model_used"] == settings.thinking_model_groq
    assert done["provider_used"] == "groq"


def test_thinking_mode_without_anthropic_key_uses_groq(client, monkeypatch, sample_pdf, set_anthropic_key):
    set_anthropic_key(None)
    seen = {}

    async def fake_groq(prompt: str, model: str):
        seen["provider"] = "groq"
        seen["model"] = model
        yield "Groq thinking answer."

    async def forbidden_anthropic(prompt: str, model: str):
        raise AssertionError("Anthropic should not be used without ANTHROPIC_API_KEY")
        yield ""

    monkeypatch.setattr("app.services.llm_service._stream_groq", fake_groq)
    monkeypatch.setattr("app.services.llm_service._stream_anthropic", forbidden_anthropic)
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={
            "session_id": session_id,
            "question": "What is this document about?",
            "model_preference": "thinking",
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    assert seen == {"provider": "groq", "model": settings.thinking_model_groq}
    assert "llama-3.3-70b-versatile" in body
    done = _done_message(body)
    assert done["model_used"] == settings.thinking_model_groq
    assert done["provider_used"] == "groq"


def test_thinking_mode_with_anthropic_key_uses_claude(client, monkeypatch, sample_pdf, set_anthropic_key):
    set_anthropic_key("sk-ant-dummy-for-test")
    seen = {}

    async def forbidden_groq(prompt: str, model: str):
        raise AssertionError("Groq should not be used for thinking mode when Anthropic is configured")
        yield ""

    async def fake_anthropic(prompt: str, model: str):
        seen["provider"] = "anthropic"
        seen["model"] = model
        yield "Claude thinking answer."

    monkeypatch.setattr("app.services.llm_service._stream_groq", forbidden_groq)
    monkeypatch.setattr("app.services.llm_service._stream_anthropic", fake_anthropic)
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={
            "session_id": session_id,
            "question": "What is this document about?",
            "model_preference": "thinking",
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    assert seen == {"provider": "anthropic", "model": settings.thinking_model_anthropic}
    done = _done_message(body)
    assert done["model_used"] == settings.thinking_model_anthropic
    assert done["provider_used"] == "anthropic"


def test_fast_mode_always_uses_groq(client, monkeypatch, sample_pdf, set_anthropic_key):
    set_anthropic_key("sk-ant-dummy-for-test")
    seen = {}

    async def fake_groq(prompt: str, model: str):
        seen["provider"] = "groq"
        seen["model"] = model
        yield "Fast Groq answer."

    async def forbidden_anthropic(prompt: str, model: str):
        raise AssertionError("Fast mode must never route to Anthropic")
        yield ""

    monkeypatch.setattr("app.services.llm_service._stream_groq", fake_groq)
    monkeypatch.setattr("app.services.llm_service._stream_anthropic", forbidden_anthropic)
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
    assert resolve_model("fast") == (settings.fast_model, "groq")
    assert seen == {"provider": "groq", "model": settings.fast_model}
    done = _done_message(body)
    assert done["model_used"] == settings.fast_model
    assert done["provider_used"] == "groq"


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
