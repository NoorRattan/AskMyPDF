import asyncio
import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import UploadResponse
from app.services.embedding_service import embed_texts
from app.services.pdf_service import chunk_text, extract_text_by_page
from app.services.vector_service import add_chunks

router = APIRouter()


def _is_pdf(file: UploadFile) -> bool:
    filename = file.filename or ""
    return file.content_type == "application/pdf" and filename.lower().endswith(".pdf")


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile) -> UploadResponse:
    if not _is_pdf(file):
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_file_type", "detail": "Only PDF files are accepted."},
        )

    session_id = uuid4().hex[:16]
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{session_id}.pdf"

    try:
        size = 0
        max_size = settings.max_file_size_mb * 1024 * 1024

        with file_path.open("wb") as out:
            while buf := await file.read(1024 * 1024):
                size += len(buf)
                if size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail={
                            "error": "file_too_large",
                            "detail": f"File exceeds the {settings.max_file_size_mb}MB limit.",
                        },
                    )
                out.write(buf)

        if size == 0:
            raise HTTPException(
                status_code=400,
                detail={"error": "empty_file", "detail": "The uploaded file is empty."},
            )

        try:
            pages = extract_text_by_page(str(file_path))
            chunks = chunk_text(pages, settings.chunk_size, settings.chunk_overlap)
            texts = [chunk["text"] for chunk in chunks]

            loop = asyncio.get_running_loop()
            embeddings = await loop.run_in_executor(None, embed_texts, texts)
            add_chunks(session_id, chunks, embeddings)
        except ValueError as exc:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "processing_failed",
                    "detail": "Failed to extract text. The PDF may be scanned or encrypted.",
                },
            ) from exc
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail={"error": "processing_failed", "detail": "Failed to process PDF."},
            ) from exc

        return UploadResponse(
            session_id=session_id,
            filename=file.filename or "document.pdf",
            page_count=len(pages),
            chunk_count=len(chunks),
            message="PDF processed successfully. Ready to chat!",
        )
    finally:
        await file.close()
        if file_path.exists():
            os.remove(file_path)
