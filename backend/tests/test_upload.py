import re
import pytest

from pypdf import PdfWriter
from reportlab.pdfgen import canvas


@pytest.mark.integration
def test_embeddings_are_semantic():
    """Semantically similar sentences must be closer than unrelated ones."""
    import numpy as np

    from app.services.embedding_service import embed_texts

    a = "The company's revenue increased significantly this quarter."
    b = "Sales grew a lot in the last three months."
    c = "The cat sat on the windowsill in the afternoon sun."

    emb_a, emb_b, emb_c = embed_texts([a, b, c])
    sim_ab = np.dot(emb_a, emb_b)
    sim_ac = np.dot(emb_a, emb_c)

    assert sim_ab > sim_ac, "Semantically related sentences should be more similar than unrelated ones"
    assert sim_ab > 0.5, "Related sentences should have reasonably high cosine similarity"


def test_hash_embedding_backend_is_lightweight(monkeypatch):
    from app.config import settings
    import app.services.embedding_service as embedding_service

    monkeypatch.setattr(settings, "embedding_backend", "hash")
    monkeypatch.setattr(settings, "embedding_dimensions", 32)

    embeddings = embedding_service.embed_texts(["AskMyPDF retrieves cited PDF answers."])

    assert embedding_service.get_embedding_model_name() == "hashing-vectorizer-32d"
    assert len(embeddings) == 1
    assert len(embeddings[0]) == 32
    assert any(value != 0 for value in embeddings[0])


def _post_pdf(client, path, filename: str):
    with path.open("rb") as file:
        return client.post(
            "/api/upload",
            files={"file": (filename, file, "application/pdf")},
        )


def _status(client, job_id: str):
    response = client.get(f"/api/upload/status/{job_id}")
    assert response.status_code == 200
    return response.json()


def test_upload_happy_path(client, sample_pdf):
    response = _post_pdf(client, sample_pdf, "sample.pdf")

    assert response.status_code == 200
    body = response.json()
    assert re.fullmatch(r"[a-f0-9]{16}", body["job_id"])
    assert body["status"] == "queued"

    status = _status(client, body["job_id"])
    assert status["status"] == "ready"
    assert re.fullmatch(r"[a-f0-9]{16}", status["session_id"])
    assert status["filename"] == "sample.pdf"
    assert status["page_count"] == 1
    assert status["chunk_count"] > 0
    assert status["progress"] == 100


def test_upload_short_text_pdf(client, tmp_path):
    path = tmp_path / "short.pdf"
    c = canvas.Canvas(str(path))
    c.drawString(72, 720, "Short PDF with extractable text.")
    c.save()

    response = _post_pdf(client, path, "short.pdf")

    assert response.status_code == 200
    status = _status(client, response.json()["job_id"])
    assert status["status"] == "ready"
    assert status["filename"] == "short.pdf"
    assert status["page_count"] == 1
    assert status["chunk_count"] == 1


def test_upload_scanned_pdf_job_fails(client, tmp_path):
    path = tmp_path / "blank.pdf"
    c = canvas.Canvas(str(path))
    c.showPage()
    c.save()

    response = _post_pdf(client, path, "blank.pdf")

    assert response.status_code == 200
    status = _status(client, response.json()["job_id"])
    assert status["status"] == "error"
    assert status["error"]


def test_upload_password_protected_pdf_job_fails(client, tmp_path):
    path = tmp_path / "protected.pdf"
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.encrypt("secret")

    with path.open("wb") as file:
        writer.write(file)

    response = _post_pdf(client, path, "protected.pdf")

    assert response.status_code == 200
    status = _status(client, response.json()["job_id"])
    assert status["status"] == "error"
    assert "encrypted" in status["message"]
    assert "password" in status["error"].lower() or "encrypted" in status["error"].lower()


def test_upload_status_unknown_job(client):
    response = client.get("/api/upload/status/abcdef1234567890")

    assert response.status_code == 404
    assert response.json()["error"] == "job_not_found"


def test_upload_wrong_content_type(client, sample_pdf):
    with sample_pdf.open("rb") as file:
        response = client.post(
            "/api/upload",
            files={"file": ("sample.pdf", file, "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "invalid_file_type"


def test_upload_pdf_content_type_wrong_extension(client, sample_pdf):
    with sample_pdf.open("rb") as file:
        response = client.post(
            "/api/upload",
            files={"file": ("sample.txt", file, "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "invalid_file_type"


def test_upload_empty_file(client):
    response = client.post(
        "/api/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "empty_file"


def test_upload_rate_limit_returns_429(client, monkeypatch):
    from app.config import settings
    from app.services.rate_limiter import reset_rate_limits

    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "upload_rate_limit_per_minute", 2)
    reset_rate_limits()
    headers = {"x-forwarded-for": "203.0.113.10"}

    for _ in range(2):
        response = client.post(
            "/api/upload",
            files={"file": ("bad.txt", b"not a pdf", "text/plain")},
            headers=headers,
        )
        assert response.status_code == 400

    response = client.post(
        "/api/upload",
        files={"file": ("bad.txt", b"not a pdf", "text/plain")},
        headers=headers,
    )

    assert response.status_code == 429
    assert response.json()["error"] == "rate_limited"
    assert response.headers["retry-after"]


def test_completed_upload_jobs_expire_and_remove_files(tmp_path, monkeypatch):
    import app.services.upload_jobs as upload_jobs

    now = 1000.0
    file_path = tmp_path / "stale.pdf"
    file_path.write_bytes(b"%PDF stale")
    monkeypatch.setattr(upload_jobs.settings, "upload_job_ttl_seconds", 5)
    monkeypatch.setattr(upload_jobs, "_now", lambda: now)

    job = upload_jobs.create_job("a" * 16, "stale.pdf", str(file_path))
    upload_jobs.update_job(job.job_id, status="ready")

    monkeypatch.setattr(upload_jobs, "_now", lambda: now + 6)

    assert upload_jobs.get_job(job.job_id) is None
    assert not file_path.exists()


def test_failed_upload_jobs_expire_and_remove_files(tmp_path, monkeypatch):
    import app.services.upload_jobs as upload_jobs

    now = 2000.0
    file_path = tmp_path / "failed.pdf"
    file_path.write_bytes(b"%PDF failed")
    monkeypatch.setattr(upload_jobs.settings, "upload_job_ttl_seconds", 5)
    monkeypatch.setattr(upload_jobs, "_now", lambda: now)

    job = upload_jobs.create_job("b" * 16, "failed.pdf", str(file_path))
    upload_jobs.update_job(job.job_id, status="error")

    monkeypatch.setattr(upload_jobs, "_now", lambda: now + 6)

    assert upload_jobs.get_job(job.job_id) is None
    assert not file_path.exists()
