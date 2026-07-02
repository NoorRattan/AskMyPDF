from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

UploadJobStatus = Literal["queued", "extracting", "chunking", "embedding", "ready", "error"]
ModelPreference = Literal["offline", "fast", "thinking"]


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
    model_config = ConfigDict(protected_namespaces=())

    session_id: str = Field(..., min_length=16, max_length=16, pattern=r"^[a-f0-9]+$")
    question: str = Field(..., min_length=1, max_length=1000)
    model_preference: ModelPreference = "offline"


class SourceChunk(BaseModel):
    text: str
    page_number: int
    chunk_index: int


class ChatResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    answer: str
    sources: list[SourceChunk]
    session_id: str
    model_used: str | None = None
    provider_used: str | None = None
    mode_used: str | None = None


class SavedAnswerRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    session_id: str = Field(..., min_length=16, max_length=16, pattern=r"^[a-f0-9]+$")
    question: str = Field(..., min_length=1, max_length=1000)
    answer: str = Field(..., min_length=1, max_length=50000)
    sources: list[SourceChunk] = Field(default_factory=list, max_length=20)
    model_used: str | None = Field(default=None, max_length=160)
    provider_used: str | None = Field(default=None, max_length=80)
    mode_used: str | None = Field(default=None, max_length=40)


class SavedAnswerResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    saved_answer_id: str
    session_id: str
    question: str
    answer: str
    sources: list[SourceChunk]
    model_used: str | None = None
    provider_used: str | None = None
    mode_used: str | None = None
    created_at: str


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
