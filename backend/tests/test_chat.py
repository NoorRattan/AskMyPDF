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
        json={"session_id": session_id, "question": "What is this document about?", "model_preference": "fast"},
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
    assert done["mode_used"] == "online"


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
    assert done["mode_used"] == "online"


def test_chat_offline_model_uses_local_answer(client, sample_pdf, monkeypatch):
    async def forbidden_groq(prompt: str, model: str):
        raise AssertionError("Offline model must not call Groq")
        yield ""

    async def forbidden_anthropic(prompt: str, model: str):
        raise AssertionError("Offline model must not call Anthropic")
        yield ""

    monkeypatch.setattr("app.services.llm_service._stream_groq", forbidden_groq)
    monkeypatch.setattr("app.services.llm_service._stream_anthropic", forbidden_anthropic)
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={
            "session_id": session_id,
            "question": "What is this document about?",
            "model_preference": "offline",
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    streamed_answer = "".join(message["token"] for message in _sse_messages(body) if "token" in message)
    assert "From the document:" in streamed_answer
    assert "AskMyPDF" in streamed_answer
    done = _done_message(body)
    assert done["model_used"] == settings.offline_model
    assert done["provider_used"] == "local"
    assert done["mode_used"] == "offline"


def test_chat_defaults_to_offline_model(client, sample_pdf, monkeypatch):
    async def forbidden_groq(prompt: str, model: str):
        raise AssertionError("Default model must not call Groq")
        yield ""

    monkeypatch.setattr("app.services.llm_service._stream_groq", forbidden_groq)
    session_id = _upload(client, sample_pdf)

    with client.stream(
        "POST",
        "/api/chat",
        json={"session_id": session_id, "question": "What is this document about?"},
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    done = _done_message(body)
    assert done["model_used"] == settings.offline_model
    assert done["provider_used"] == "local"
    assert done["mode_used"] == "offline"


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
    assert done["mode_used"] == "online"


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
    assert done["mode_used"] == "online"


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
    assert done["mode_used"] == "online"


def test_online_model_without_api_key_is_rejected_before_stream(client, monkeypatch, sample_pdf, set_anthropic_key):
    monkeypatch.setattr(settings, "groq_api_key", "")
    set_anthropic_key(None)
    session_id = _upload(client, sample_pdf)

    response = client.post(
        "/api/chat",
        json={
            "session_id": session_id,
            "question": "What is this document about?",
            "model_preference": "fast",
        },
    )

    assert response.status_code == 503
    assert response.json()["error"] == "model_unavailable"


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


def test_chat_rate_limit_returns_429(client, monkeypatch):
    from app.services.rate_limiter import reset_rate_limits

    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "chat_rate_limit_per_minute", 2)
    reset_rate_limits()
    headers = {"x-forwarded-for": "203.0.113.20"}
    payload = {"session_id": "abcdef1234567890", "question": "What is this?"}

    for _ in range(2):
        response = client.post("/api/chat", json=payload, headers=headers)
        assert response.status_code == 404

    response = client.post("/api/chat", json=payload, headers=headers)

    assert response.status_code == 429
    assert response.json()["error"] == "rate_limited"
    assert response.headers["retry-after"]


def test_save_and_list_cited_answer(client, sample_pdf):
    session_id = _upload(client, sample_pdf)
    payload = {
        "session_id": session_id,
        "question": "What is this document about?",
        "answer": "From the document: AskMyPDF retrieves cited PDF answers.",
        "sources": [{"text": "AskMyPDF retrieves cited PDF answers.", "page_number": 1, "chunk_index": 0}],
        "model_used": settings.offline_model,
        "provider_used": "local",
        "mode_used": "offline",
    }

    save_response = client.post("/api/saved-answers", json=payload)

    assert save_response.status_code == 200
    saved = save_response.json()
    assert saved["saved_answer_id"]
    assert saved["session_id"] == session_id
    assert saved["question"] == payload["question"]
    assert saved["sources"][0]["page_number"] == 1

    list_response = client.get(f"/api/sessions/{session_id}/saved-answers")

    assert list_response.status_code == 200
    body = list_response.json()
    assert len(body) == 1
    assert body[0]["saved_answer_id"] == saved["saved_answer_id"]


def test_save_cited_answer_unknown_session(client):
    response = client.post(
        "/api/saved-answers",
        json={
            "session_id": "abcdef1234567890",
            "question": "What is this?",
            "answer": "A cited answer.",
            "sources": [],
        },
    )

    assert response.status_code == 404
    assert response.json()["error"] == "session_not_found"


def test_delete_session_removes_chat_and_saved_answers(client, sample_pdf):
    session_id = _upload(client, sample_pdf)
    payload = {
        "session_id": session_id,
        "question": "What is this document about?",
        "answer": "From the document: AskMyPDF retrieves cited PDF answers.",
        "sources": [{"text": "AskMyPDF retrieves cited PDF answers.", "page_number": 1, "chunk_index": 0}],
    }
    save_response = client.post("/api/saved-answers", json=payload)
    assert save_response.status_code == 200

    response = client.delete(f"/api/session/{session_id}")

    assert response.status_code == 200
    assert response.json()["message"] == "Session deleted."
    missing_chat = client.post(
        "/api/chat",
        json={"session_id": session_id, "question": "What is this document about?"},
    )
    assert missing_chat.status_code == 404
    missing_answers = client.get(f"/api/sessions/{session_id}/saved-answers")
    assert missing_answers.status_code == 404


def test_delete_unknown_session_returns_404(client):
    response = client.delete("/api/session/abcdef1234567890")

    assert response.status_code == 404
    assert response.json()["error"] == "session_not_found"
