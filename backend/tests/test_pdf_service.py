import pytest

from app.services import pdf_service


def test_extract_uses_pypdf_when_pymupdf_unavailable(sample_pdf, monkeypatch):
    monkeypatch.setattr(pdf_service, "fitz", None)

    pages = pdf_service.extract_text_by_page(str(sample_pdf))

    assert pages
    assert pages[0]["page_number"] == 1
    assert "AskMyPDF" in pages[0]["text"]


def test_pdfplumber_fallback_for_small_pdf(monkeypatch):
    fallback_pages = [{"page_number": 1, "text": "Fallback text with enough extractable content."}]
    calls = []

    def fake_pypdf(file_path: str, progress_callback=None):
        calls.append("pypdf")
        return [], 1

    def fake_pdfplumber(file_path: str, progress_callback=None):
        calls.append("pdfplumber")
        return fallback_pages

    monkeypatch.setattr(pdf_service, "fitz", None)
    monkeypatch.setattr(pdf_service, "_extract_with_pypdf", fake_pypdf)
    monkeypatch.setattr(pdf_service, "_extract_with_pdfplumber", fake_pdfplumber)

    pages = pdf_service.extract_text_by_page("sample.pdf")

    assert pages == fallback_pages
    assert calls == ["pypdf", "pdfplumber"]


def test_pdfplumber_fallback_skipped_for_large_pdf(monkeypatch):
    calls = []

    def fake_pypdf(file_path: str, progress_callback=None):
        calls.append("pypdf")
        return [], pdf_service.PDFPLUMBER_FALLBACK_MAX_PAGES + 1

    def fake_pdfplumber(file_path: str, progress_callback=None):
        calls.append("pdfplumber")
        return [{"page_number": 1, "text": "This should not be used."}]

    monkeypatch.setattr(pdf_service, "fitz", None)
    monkeypatch.setattr(pdf_service, "_extract_with_pypdf", fake_pypdf)
    monkeypatch.setattr(pdf_service, "_extract_with_pdfplumber", fake_pdfplumber)

    with pytest.raises(ValueError):
        pdf_service.extract_text_by_page("large.pdf")

    assert calls == ["pypdf"]
