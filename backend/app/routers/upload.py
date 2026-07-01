import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import UploadJobResponse, UploadStatusResponse
from app.services.embedding_service import embed_texts
from app.services.pdf_service import chunk_text, extract_text_by_page
from app.services.upload_jobs import create_job, get_job, serialize_job, update_job
from app.services.vector_service import add_chunks

router = APIRouter()


def _is_pdf(file: UploadFile) -> bool:
    filename = file.filename or ""
    return file.content_type == "application/pdf" and filename.lower().endswith(".pdf")


def _remove_file(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def _set_job_stage(job_id: str, status: str, message: str, progress: int, **extra: object) -> None:
    update_job(
        job_id,
        status=status,
        stage=status,
        message=message,
        progress=max(0, min(100, progress)),
        **extra,
    )


def _embed_with_progress(job_id: str, texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    batch_size = max(1, settings.upload_embedding_batch_size)

    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        embeddings.extend(embed_texts(batch))
        complete = min(start + len(batch), len(texts))
        progress = 70 + int((complete / max(len(texts), 1)) * 25)
        _set_job_stage(
            job_id,
            "embedding",
            f"Generating embeddings ({complete}/{len(texts)} chunks)...",
            progress,
        )

    return embeddings


def process_upload_job(job_id: str) -> None:
    job = get_job(job_id)
    if job is None:
        return

    try:
        _set_job_stage(job_id, "extracting", "Extracting text from the PDF...", 5)

        def extraction_progress(page_number: int, page_count: int) -> None:
            progress = 5 + int((page_number / max(page_count, 1)) * 50)
            _set_job_stage(
                job_id,
                "extracting",
                f"Extracting text (page {page_number}/{page_count})...",
                progress,
                page_count=page_count,
            )

        pages = extract_text_by_page(job.file_path, progress_callback=extraction_progress)

        _set_job_stage(
            job_id,
            "chunking",
            f"Structuring document text ({len(pages)} pages)...",
            62,
            page_count=len(pages),
        )
        chunks = chunk_text(pages, settings.chunk_size, settings.chunk_overlap)
        if not chunks:
            raise ValueError("PDF has no chunkable text.")

        _set_job_stage(
            job_id,
            "embedding",
            f"Generating embeddings (0/{len(chunks)} chunks)...",
            70,
            page_count=len(pages),
            chunk_count=len(chunks),
        )
        texts = [chunk["text"] for chunk in chunks]
        embeddings = _embed_with_progress(job_id, texts)

        session_id = uuid4().hex[:16]
        add_chunks(session_id, chunks, embeddings)
        update_job(
            job_id,
            status="ready",
            stage="ready",
            message="PDF processed successfully. Ready to chat!",
            progress=100,
            page_count=len(pages),
            chunk_count=len(chunks),
            session_id=session_id,
            error=None,
        )
    except ValueError as exc:
        update_job(
            job_id,
            status="error",
            stage="error",
            message="Failed to extract text. The PDF may be scanned or encrypted.",
            progress=100,
            error=str(exc),
        )
    except Exception as exc:
        update_job(
            job_id,
            status="error",
            stage="error",
            message="Failed to process PDF.",
            progress=100,
            error=str(exc),
        )
    finally:
        _remove_file(job.file_path)


@router.post("/upload", response_model=UploadJobResponse)
async def upload_pdf(file: UploadFile, background_tasks: BackgroundTasks) -> UploadJobResponse:
    if not _is_pdf(file):
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_file_type", "detail": "Only PDF files are accepted."},
        )

    job_id = uuid4().hex[:16]
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{job_id}.pdf"

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

        create_job(job_id, file.filename or "document.pdf", str(file_path))
        background_tasks.add_task(process_upload_job, job_id)
        return UploadJobResponse(
            job_id=job_id,
            status="queued",
            message="Upload received. Processing started.",
        )
    except HTTPException:
        _remove_file(str(file_path))
        raise
    finally:
        await file.close()


@router.get("/upload/status/{job_id}", response_model=UploadStatusResponse)
def upload_status(job_id: str) -> UploadStatusResponse:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "job_not_found", "detail": "Upload job was not found."},
        )

    return UploadStatusResponse(**serialize_job(job))
