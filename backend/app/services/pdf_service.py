from collections.abc import Callable

import pdfplumber
from pypdf import PdfReader

try:
    import fitz
except ImportError:  # PyMuPDF is optional for local Windows/Python 3.13 development.
    fitz = None

MIN_EXTRACTED_CHARS = 20
PDFPLUMBER_FALLBACK_MAX_PAGES = 25
ProgressCallback = Callable[[int, int], None] | None


def _normalize_page_text(text: str | None) -> str:
    return (text or "").strip()


def _has_enough_text(pages: list[dict]) -> bool:
    return len("".join(page["text"] for page in pages)) >= MIN_EXTRACTED_CHARS


def _extract_with_pymupdf(file_path: str, progress_callback: ProgressCallback = None) -> tuple[list[dict], int]:
    if fitz is None:
        return [], 0

    pages: list[dict] = []

    with fitz.open(file_path) as doc:
        page_count = doc.page_count
        if getattr(doc, "needs_pass", False):
            doc.authenticate("")

        for idx in range(page_count):
            text = doc.load_page(idx).get_text("text")
            stripped = _normalize_page_text(text)
            if stripped:
                pages.append({"page_number": idx + 1, "text": stripped})
            if progress_callback:
                progress_callback(idx + 1, page_count)

    return pages, page_count


def _extract_with_pypdf(file_path: str, progress_callback: ProgressCallback = None) -> tuple[list[dict], int]:
    pages: list[dict] = []
    reader = PdfReader(file_path)

    if reader.is_encrypted:
        reader.decrypt("")

    page_count = len(reader.pages)
    for idx, page in enumerate(reader.pages, start=1):
        stripped = _normalize_page_text(page.extract_text())
        if not stripped:
            if progress_callback:
                progress_callback(idx, page_count)
            continue

        pages.append({"page_number": idx, "text": stripped})
        if progress_callback:
            progress_callback(idx, page_count)

    return pages, page_count


def _extract_with_pdfplumber(file_path: str, progress_callback: ProgressCallback = None) -> list[dict]:
    pages: list[dict] = []

    with pdfplumber.open(file_path) as pdf:
        page_count = len(pdf.pages)
        for idx, page in enumerate(pdf.pages, start=1):
            stripped = _normalize_page_text(page.extract_text())
            if not stripped:
                if progress_callback:
                    progress_callback(idx, page_count)
                continue

            pages.append({"page_number": idx, "text": stripped})
            if progress_callback:
                progress_callback(idx, page_count)

    return pages


def extract_text_by_page(file_path: str, progress_callback: ProgressCallback = None) -> list[dict]:
    pages: list[dict] = []
    page_count = 0

    try:
        pages, page_count = _extract_with_pymupdf(file_path, progress_callback)
    except Exception:
        pages, page_count = [], 0

    if not _has_enough_text(pages):
        pages, page_count = _extract_with_pypdf(file_path, progress_callback)

    if not _has_enough_text(pages) and page_count <= PDFPLUMBER_FALLBACK_MAX_PAGES:
        pages = _extract_with_pdfplumber(file_path, progress_callback)

    if not _has_enough_text(pages):
        raise ValueError("PDF appears to be scanned or has no extractable text.")

    return pages


def chunk_text(pages: list[dict], chunk_size: int, chunk_overlap: int) -> list[dict]:
    chunks: list[dict] = []
    chunk_index = 0
    step = chunk_size - chunk_overlap

    if step <= 0:
        raise ValueError("chunk_overlap must be smaller than chunk_size.")

    for page in pages:
        text = page["text"]
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end].strip()

            if len(chunk) >= 20:
                chunks.append(
                    {
                        "text": chunk,
                        "page_number": page["page_number"],
                        "chunk_index": chunk_index,
                        "char_start": start,
                        "char_end": min(end, len(text)),
                    }
                )
                chunk_index += 1

            start += step

    return chunks
