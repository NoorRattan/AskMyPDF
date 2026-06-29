import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas

os.environ.setdefault("GROQ_API_KEY", "test_api_key")
os.environ.setdefault("CHROMA_PATH", "./data/test_chroma")
os.environ.setdefault("UPLOAD_DIR", "./data/test_uploads")

import app.main as main_mod
from app.main import app
from app.routers import chat, upload


class InMemoryStore:
    def __init__(self) -> None:
        self.sessions: dict[str, list[dict]] = {}

    def add_chunks(self, session_id: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
        self.sessions[session_id] = chunks

    def session_exists(self, session_id: str) -> bool:
        return session_id in self.sessions

    def query_chunks(self, session_id: str, query_embedding: list[float], top_k: int) -> list[dict]:
        return self.sessions.get(session_id, [])[:top_k]


@pytest.fixture(scope="session")
def sample_pdf(tmp_path_factory) -> Path:
    path = tmp_path_factory.mktemp("pdfs") / "sample.pdf"
    c = canvas.Canvas(str(path))
    c.drawString(72, 720, "AskMyPDF is a portfolio RAG chatbot for uploaded PDF documents.")
    c.drawString(72, 700, "It extracts text, creates chunks, embeds them, and streams answers.")
    c.drawString(72, 680, "This sample document is intentionally long enough for extraction tests.")
    c.save()
    return path


@pytest.fixture(scope="session")
def client() -> TestClient:
    patch = pytest.MonkeyPatch()
    patch.setattr(main_mod, "get_model", lambda: object())
    patch.setattr(main_mod, "get_client", lambda: object())
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        patch.undo()


@pytest.fixture(autouse=True)
def fake_pipeline(monkeypatch):
    store = InMemoryStore()

    def fake_embed_texts(texts: list[str]) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]

    monkeypatch.setattr(upload, "embed_texts", fake_embed_texts)
    monkeypatch.setattr(upload, "add_chunks", store.add_chunks)
    monkeypatch.setattr(chat, "embed_texts", fake_embed_texts)
    monkeypatch.setattr(chat, "session_exists", store.session_exists)
    monkeypatch.setattr(chat, "query_chunks", store.query_chunks)
    return store


@pytest.fixture
def mock_llm(monkeypatch):
    async def fake_stream(question: str, chunks: list[dict]):
        yield "This document describes "
        yield "AskMyPDF."

    monkeypatch.setattr("app.routers.chat.stream_answer", fake_stream)
