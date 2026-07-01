from __future__ import annotations

import os
import time
from dataclasses import dataclass
from threading import RLock
from typing import Literal

from app.config import settings

UploadJobStatus = Literal["queued", "extracting", "chunking", "embedding", "ready", "error"]


@dataclass
class UploadJob:
    job_id: str
    filename: str
    file_path: str
    status: UploadJobStatus = "queued"
    stage: str = "queued"
    message: str = "Queued for processing."
    progress: int = 0
    page_count: int | None = None
    chunk_count: int | None = None
    session_id: str | None = None
    error: str | None = None
    created_at: float = 0.0
    updated_at: float = 0.0


_jobs: dict[str, UploadJob] = {}
_lock = RLock()


def _now() -> float:
    return time.time()


def _remove_file(path: str) -> None:
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def cleanup_jobs() -> None:
    cutoff = _now() - settings.upload_job_ttl_seconds

    with _lock:
        expired_ids = [
            job_id
            for job_id, job in _jobs.items()
            if job.updated_at < cutoff and job.status in {"ready", "error"}
        ]

        for job_id in expired_ids:
            job = _jobs.pop(job_id)
            _remove_file(job.file_path)


def create_job(job_id: str, filename: str, file_path: str) -> UploadJob:
    cleanup_jobs()
    now = _now()
    job = UploadJob(
        job_id=job_id,
        filename=filename,
        file_path=file_path,
        created_at=now,
        updated_at=now,
    )

    with _lock:
        _jobs[job_id] = job

    return job


def get_job(job_id: str) -> UploadJob | None:
    with _lock:
        return _jobs.get(job_id)


def update_job(job_id: str, **updates: object) -> UploadJob | None:
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return None

        for key, value in updates.items():
            if hasattr(job, key):
                setattr(job, key, value)

        job.updated_at = _now()
        return job


def serialize_job(job: UploadJob) -> dict:
    return {
        "job_id": job.job_id,
        "status": job.status,
        "stage": job.stage,
        "message": job.message,
        "progress": job.progress,
        "filename": job.filename,
        "page_count": job.page_count,
        "chunk_count": job.chunk_count,
        "session_id": job.session_id,
        "error": job.error,
    }
