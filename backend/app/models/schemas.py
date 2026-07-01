from typing import Literal

from pydantic import BaseModel, Field

UploadJobStatus = Literal["queued", "extracting", "chunking", "embedding", "ready", "error"]
ModelPreference = Literal["fast", "thinking"]


class UploadResponse(BaseModel):
    session_id: str
    filename: str
    page_count: int
    chunk_count: int
    message: str


class UploadJobResponse(BaseModel):
    job_id: str
    status: UploadJobStatus
    message: str


class UploadStatusResponse(BaseModel):
    job_id: str
    status: UploadJobStatus
    stage: str
    message: str
    progress: int
    filename: str
    page_count: int | None = None
    chunk_count: int | None = None
    session_id: str | None = None
    error: str | None = None


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=16, max_length=16, pattern=r"^[a-f0-9]+$")
    question: str = Field(..., min_length=1, max_length=1000, strip_whitespace=True)
    model_preference: ModelPreference = "fast"


class SourceChunk(BaseModel):
    text: str
    page_number: int
    chunk_index: int


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    session_id: str
    model_used: str | None = None


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
