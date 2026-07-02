from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator

from anthropic import AsyncAnthropic
from groq import AsyncGroq

from app.config import settings
from app.services.offline_answer_service import build_offline_answer, stream_text

SYSTEM_PROMPT = """You are a precise document assistant. Your job is to answer questions about a PDF document using only the context provided below.

Rules:
- Answer only from the provided context. Do not use outside knowledge.
- If the answer is not in the context, say exactly: "I couldn't find that in the document."
- Be concise. 2-4 sentences is usually enough.
- When you cite information, mention the page number: e.g. "(page 3)"
- Do not make up information or extrapolate beyond what the text says."""


def build_context(chunks: list[dict]) -> str:
    return "\n\n---\n\n".join(
        f"[Page {chunk['page_number']}]\n{chunk['text']}" for chunk in chunks
    )


def resolve_model(model_preference: str = "fast") -> tuple[str, str]:
    if model_preference == "offline":
        return settings.offline_model, "local"

    if model_preference == "fast":
        return settings.fast_model, "groq"

    if settings.anthropic_api_key:
        return settings.thinking_model_anthropic, "anthropic"
    return settings.thinking_model_groq, "groq"


def model_is_available(model_preference: str) -> bool:
    _model, provider = resolve_model(model_preference)
    if provider == "local":
        return True
    if provider == "groq":
        return bool(settings.groq_api_key.strip())
    if provider == "anthropic":
        return bool(settings.anthropic_api_key and settings.anthropic_api_key.strip())
    return False


def get_model_catalog() -> list[dict[str, object]]:
    thinking_model, thinking_provider = resolve_model("thinking")
    return [
        {
            "id": "offline",
            "label": "Offline Local",
            "mode": "offline",
            "provider": "local",
            "model": settings.offline_model,
            "available": True,
            "description": "Runs inside the backend using retrieved PDF chunks only. No external LLM request is made.",
        },
        {
            "id": "fast",
            "label": "Fast Online",
            "mode": "online",
            "provider": "groq",
            "model": settings.fast_model,
            "available": model_is_available("fast"),
            "description": "Low-latency Groq route for direct factual questions.",
        },
        {
            "id": "thinking",
            "label": "Deep Online",
            "mode": "online",
            "provider": thinking_provider,
            "model": thinking_model,
            "available": model_is_available("thinking"),
            "description": "Higher quality synthesis route using Claude when configured, otherwise Groq 70B.",
        },
    ]


async def _stream_groq(prompt: str, model: str) -> AsyncGenerator[str, None]:
    client = AsyncGroq(api_key=settings.groq_api_key)
    stream = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_completion_tokens=1024,
        stream=True,
    )

    async for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text


async def _stream_anthropic(prompt: str, model: str) -> AsyncGenerator[str, None]:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async with client.messages.stream(
        model=model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            if text:
                yield text


async def _stream_offline_answer(question: str, context_chunks: list[dict]) -> AsyncGenerator[str, None]:
    answer = build_offline_answer(question, context_chunks)
    for token in stream_text(answer):
        await asyncio.sleep(0)
        yield token


async def stream_answer(
    question: str,
    context_chunks: list[dict],
    model_preference: str = "fast",
) -> AsyncGenerator[str, None]:
    model, provider = resolve_model(model_preference)

    if provider == "local":
        async for token in _stream_offline_answer(question, context_chunks):
            yield token
        return

    if not model_is_available(model_preference):
        raise RuntimeError(f"Model route '{model_preference}' is not configured.")

    context = build_context(context_chunks)
    prompt = f"Context:\n{context}\n\nQuestion: {question}"

    if provider == "groq":
        async for token in _stream_groq(prompt, model):
            yield token
        return

    async for token in _stream_anthropic(prompt, model):
        yield token
