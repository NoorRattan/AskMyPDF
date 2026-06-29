import pdfplumber


def extract_text_by_page(file_path: str) -> list[dict]:
    pages: list[dict] = []
    total_text_parts: list[str] = []

    with pdfplumber.open(file_path) as pdf:
        for idx, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            stripped = text.strip()
            if not stripped:
                continue

            pages.append({"page_number": idx, "text": stripped})
            total_text_parts.append(stripped)

    if len("".join(total_text_parts)) < 100:
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

            if len(chunk) >= 50:
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
