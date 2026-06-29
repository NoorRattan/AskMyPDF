from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    session_id: str
    filename: str
    page_count: int
    chunk_count: int
    message: str


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=16, max_length=16, pattern=r"^[a-f0-9]+$")
    question: str = Field(..., min_length=1, max_length=1000, strip_whitespace=True)


class SourceChunk(BaseModel):
    text: str
    page_number: int
    chunk_index: int


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    session_id: str


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
