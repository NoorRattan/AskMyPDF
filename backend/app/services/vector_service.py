from __future__ import annotations

import heapq
from array import array
from collections import OrderedDict
from collections.abc import Sequence

from app.config import settings

StoredChunk = dict[str, object]

_sessions: OrderedDict[str, list[StoredChunk]] = OrderedDict()


def get_client() -> OrderedDict[str, list[StoredChunk]]:
    return _sessions


def session_exists(session_id: str) -> bool:
    return session_id in _sessions


def _trim_sessions() -> None:
    while len(_sessions) > settings.max_sessions:
        _sessions.popitem(last=False)


def add_chunks(session_id: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
    stored_chunks: list[StoredChunk] = []

    for chunk, embedding in zip(chunks, embeddings):
        stored_chunks.append(
            {
                "text": chunk["text"],
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "char_start": chunk["char_start"],
                "char_end": chunk["char_end"],
                "embedding": array("f", embedding),
            }
        )

    _sessions[session_id] = stored_chunks
    _sessions.move_to_end(session_id)
    _trim_sessions()


def _score(left: Sequence[float], right: Sequence[float]) -> float:
    return sum(left_value * right_value for left_value, right_value in zip(left, right))


def query_chunks(session_id: str, query_embedding: list[float], top_k: int) -> list[dict]:
    chunks = _sessions.get(session_id)
    if not chunks:
        return []

    _sessions.move_to_end(session_id)
    ranked = heapq.nlargest(
        min(top_k, len(chunks)),
        chunks,
        key=lambda chunk: _score(query_embedding, chunk["embedding"]),  # type: ignore[arg-type]
    )

    return [
        {
            "text": chunk["text"],
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
            "distance": 1 - _score(query_embedding, chunk["embedding"]),  # type: ignore[arg-type]
        }
        for chunk in ranked[:top_k]
    ]


def delete_session(session_id: str) -> bool:
    return _sessions.pop(session_id, None) is not None
