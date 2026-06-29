import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import chat, upload
from app.services.embedding_service import get_model
from app.services.vector_service import get_client

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AskMyPDF",
    description="Upload PDFs and ask questions about their contents.",
    version="0.1.0",
)

allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(req: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.on_event("startup")
def warm_up_services() -> None:
    get_model()
    get_client()
    logger.info("Embedding model and vector store loaded.")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_loaded": get_model() is not None}
