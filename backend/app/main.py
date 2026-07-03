import logging
import time
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import chat, upload
from app.services.embedding_service import get_embedding_backend, get_embedding_model_name, get_model
from app.services.llm_service import get_model_catalog
from app.services.vector_service import get_client

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="AskMyPDF",
    description="Upload PDFs and ask questions about their contents.",
    version="0.1.0",
)

allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
allowed_origin_regex = settings.allowed_origin_regex.strip() if settings.allowed_origin_regex else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Request-ID"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.middleware("http")
async def add_request_observability(request: Request, call_next) -> Response:
    request_id = request.headers.get("x-request-id", uuid4().hex[:12])
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "Unhandled request failure",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
            },
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["x-request-id"] = request_id
    logger.info(
        "%s %s -> %s %.2fms request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id,
    )
    return response


def tune_optional_runtime_threads() -> None:
    if get_embedding_backend() != "sentence-transformers":
        return

    try:
        import torch
    except ImportError:
        return

    torch.set_num_threads(settings.torch_num_threads)
    logger.info("Torch thread count set to %s.", settings.torch_num_threads)


@app.exception_handler(HTTPException)
async def http_exception_handler(req: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.on_event("startup")
def warm_up_services() -> None:
    tune_optional_runtime_threads()
    if settings.anthropic_api_key:
        logger.info("Deep Online: Claude via Anthropic (Anthropic key detected)")
    elif settings.groq_api_key:
        logger.info("Deep Online: %s via Groq (no Anthropic key set)", settings.thinking_model_groq)
    else:
        logger.info("Online LLM keys are not configured; Private Server remains available.")
    get_model()
    get_client()
    logger.info("Embedding model and vector store loaded.")


@app.get("/health")
def health() -> dict:
    embedding_backend = get_embedding_backend()
    models = get_model_catalog()
    fast_model = next(model for model in models if model["id"] == "fast")
    thinking_model = next(model for model in models if model["id"] == "thinking")
    memory_profile = "render-512-safe" if embedding_backend == "hash" else "semantic-full"

    return {
        "status": "ok",
        "model_loaded": get_model() is not None,
        "embedding_model": get_embedding_model_name(),
        "embedding_backend": embedding_backend,
        "memory_profile": memory_profile,
        "offline_model": settings.offline_model,
        "offline_provider": "local",
        "fast_model": fast_model["model"],
        "fast_provider": fast_model["provider"],
        "thinking_model": thinking_model["model"],
        "thinking_provider": thinking_model["provider"],
        "available_models": models,
    }


@app.get("/api/health")
def api_health() -> dict:
    return health()
