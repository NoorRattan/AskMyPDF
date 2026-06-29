from collections.abc import AsyncGenerator

from groq import AsyncGroq

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
    client = AsyncGroq(api_key=settings.groq_api_key)

    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        max_tokens=1024,
        stream=True,
    )

    async for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text
