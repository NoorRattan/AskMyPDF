import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.config import settings
from app.models.schemas import ChatRequest, SavedAnswerRequest, SavedAnswerResponse
from app.services.embedding_service import embed_texts
from app.services.llm_service import model_is_available, resolve_model, stream_answer
from app.services.saved_answer_service import delete_saved_answers, list_saved_answers, save_answer
from app.services.vector_service import delete_session, query_chunks, session_exists

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
                "detail": "The selected online model is not configured. Choose Backend Only or configure the required API key.",
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


@router.post("/saved-answers", response_model=SavedAnswerResponse)
def save_cited_answer(req: SavedAnswerRequest) -> SavedAnswerResponse:
    if not session_exists(req.session_id):
        raise HTTPException(
            status_code=404,
            detail={
                "error": "session_not_found",
                "detail": "No PDF has been uploaded for this session. Please upload a PDF first.",
            },
        )

    record = save_answer(
        session_id=req.session_id,
        question=req.question,
        answer=req.answer,
        sources=[source.model_dump() for source in req.sources],
        model_used=req.model_used,
        provider_used=req.provider_used,
        mode_used=req.mode_used,
    )
    return SavedAnswerResponse(**record)


@router.get("/sessions/{session_id}/saved-answers", response_model=list[SavedAnswerResponse])
def get_saved_answers(session_id: str) -> list[SavedAnswerResponse]:
    if not session_exists(session_id):
        raise HTTPException(
            status_code=404,
            detail={
                "error": "session_not_found",
                "detail": "No PDF has been uploaded for this session. Please upload a PDF first.",
            },
        )

    return [SavedAnswerResponse(**record) for record in list_saved_answers(session_id)]


@router.delete("/session/{session_id}")
def delete_pdf_session(session_id: str) -> dict[str, str]:
    removed_session = delete_session(session_id)
    removed_answers = delete_saved_answers(session_id)

    if not removed_session and not removed_answers:
        raise HTTPException(
            status_code=404,
            detail={"error": "session_not_found", "detail": "No PDF has been uploaded for this session."},
        )

    return {"message": "Session deleted."}
