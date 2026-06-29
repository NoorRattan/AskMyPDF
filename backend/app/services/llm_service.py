from collections.abc import AsyncGenerator

import anthropic

from app.config import settings

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


async def stream_answer(question: str, chunks: list[dict]) -> AsyncGenerator[str, None]:
    context = build_context(chunks)
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}],
    ) as stream:
        for text in stream.text_stream:
            yield text
