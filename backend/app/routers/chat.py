import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.config import settings
from app.models.schemas import ChatRequest
from app.services.embedding_service import embed_texts
from app.services.llm_service import model_is_available, resolve_model, stream_answer
from app.services.vector_service import query_chunks, session_exists

router = APIRouter()


def _source_payload(chunks: list[dict]) -> list[dict]:
    return [
        {
            "text": chunk["text"][:300],
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
        }
        for chunk in chunks
    ]


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    if not session_exists(req.session_id):
        raise HTTPException(
            status_code=404,
            detail={
                "error": "session_not_found",
                "detail": "No PDF has been uploaded for this session. Please upload a PDF first.",
            },
        )

    if not model_is_available(req.model_preference):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "model_unavailable",
                "detail": "The selected online model is not configured. Choose Offline Local or configure the required API key.",
            },
        )

    loop = asyncio.get_running_loop()
    query_embedding = await loop.run_in_executor(None, embed_texts, [req.question])
    chunks = query_chunks(req.session_id, query_embedding[0], settings.top_k_results)
    model_used, provider_used = resolve_model(req.model_preference)
    mode_used = "offline" if provider_used == "local" else "online"

    async def events():
        async for text in stream_answer(req.question, chunks, req.model_preference):
            yield f"data: {json.dumps({'token': text})}\n\n"
        yield (
            f"data: "
            f"{json.dumps({'done': True, 'sources': _source_payload(chunks), 'model_used': model_used, 'provider_used': provider_used, 'mode_used': mode_used})}"
            f"\n\n"
        )

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
