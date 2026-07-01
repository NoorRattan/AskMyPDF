from __future__ import annotations

from collections.abc import AsyncGenerator
from dataclasses import dataclass

from anthropic import AsyncAnthropic
from groq import AsyncGroq

from app.config import settings

SYSTEM_PROMPT = """You are a precise document assistant. Your job is to answer questions about a PDF document using only the context provided below.

Rules:
- Answer only from the provided context. Do not use outside knowledge.
- If the answer is not in the context, say exactly: "I couldn't find that in the document."
- Be concise. 2-4 sentences is usually enough.
- When you cite information, mention the page number: e.g. "(page 3)"
- Do not make up information or extrapolate beyond what the text says."""


@dataclass(frozen=True)
class ResolvedModel:
    model: str
    provider: str
    fell_back: bool = False


def build_context(chunks: list[dict]) -> str:
    return "\n\n---\n\n".join(
        f"[Page {chunk['page_number']}]\n{chunk['text']}" for chunk in chunks
    )


def resolve_model(model_preference: str = "fast") -> ResolvedModel:
    if model_preference == "fast" and settings.groq_api_key:
        return ResolvedModel(settings.fast_model, settings.fast_model_provider)

    return ResolvedModel(
        settings.thinking_model,
        settings.thinking_model_provider,
        fell_back=model_preference == "fast",
    )


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


async def stream_answer(
    question: str,
    context_chunks: list[dict],
    model_preference: str = "fast",
) -> AsyncGenerator[str, None]:
    context = build_context(context_chunks)
    prompt = f"Context:\n{context}\n\nQuestion: {question}"
    resolved = resolve_model(model_preference)

    if resolved.provider == settings.fast_model_provider:
        async for token in _stream_groq(prompt, resolved.model):
            yield token
        return

    async for token in _stream_anthropic(prompt, resolved.model):
        yield token
