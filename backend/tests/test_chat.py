import json


def _upload(client, sample_pdf) -> str:
    with sample_pdf.open("rb") as file:
        response = client.post(
            "/api/upload",
            files={"file": ("sample.pdf", file, "application/pdf")},
        )
    assert response.status_code == 200
    return response.json()["session_id"]


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
