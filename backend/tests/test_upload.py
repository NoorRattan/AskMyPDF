import re

from reportlab.pdfgen import canvas


def test_upload_happy_path(client, sample_pdf):
    with sample_pdf.open("rb") as file:
        response = client.post(
            "/api/upload",
            files={"file": ("sample.pdf", file, "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert re.fullmatch(r"[a-f0-9]{16}", body["session_id"])
    assert body["filename"] == "sample.pdf"
    assert body["page_count"] == 1
    assert body["chunk_count"] > 0


def test_upload_short_text_pdf(client, tmp_path):
    path = tmp_path / "short.pdf"
    c = canvas.Canvas(str(path))
    c.drawString(72, 720, "Short PDF with extractable text.")
    c.save()

    with path.open("rb") as file:
        response = client.post(
            "/api/upload",
            files={"file": ("short.pdf", file, "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "short.pdf"
    assert body["page_count"] == 1
    assert body["chunk_count"] == 1


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
