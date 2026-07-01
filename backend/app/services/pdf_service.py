import pdfplumber
from pypdf import PdfReader

MIN_EXTRACTED_CHARS = 20
PDFPLUMBER_FALLBACK_MAX_PAGES = 25


def _normalize_page_text(text: str | None) -> str:
    return (text or "").strip()


def _has_enough_text(pages: list[dict]) -> bool:
    return len("".join(page["text"] for page in pages)) >= MIN_EXTRACTED_CHARS


def _extract_with_pypdf(file_path: str) -> tuple[list[dict], int]:
    pages: list[dict] = []
    reader = PdfReader(file_path)

    if reader.is_encrypted:
        reader.decrypt("")

    for idx, page in enumerate(reader.pages, start=1):
        stripped = _normalize_page_text(page.extract_text())
        if not stripped:
            continue

        pages.append({"page_number": idx, "text": stripped})

    return pages, len(reader.pages)


def _extract_with_pdfplumber(file_path: str) -> list[dict]:
    pages: list[dict] = []

    with pdfplumber.open(file_path) as pdf:
        for idx, page in enumerate(pdf.pages, start=1):
            stripped = _normalize_page_text(page.extract_text())
            if not stripped:
                continue

            pages.append({"page_number": idx, "text": stripped})

    return pages


def extract_text_by_page(file_path: str) -> list[dict]:
    pages, page_count = _extract_with_pypdf(file_path)

    if not _has_enough_text(pages) and page_count <= PDFPLUMBER_FALLBACK_MAX_PAGES:
        pages = _extract_with_pdfplumber(file_path)

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
