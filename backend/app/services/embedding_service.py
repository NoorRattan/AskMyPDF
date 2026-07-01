from __future__ import annotations

import hashlib
import math
import os
import re
from typing import Any

from app.config import settings

SENTENCE_TRANSFORMER_MODEL = "all-MiniLM-L6-v2"
HASH_EMBEDDING_MODEL_NAME = "hashing-vectorizer"

_model: Any | None = None


def _running_on_render() -> bool:
    return (
        os.getenv("RENDER") == "true"
        or os.getenv("RENDER_SERVICE_ID") is not None
        or settings.upload_dir.startswith("/app/")
    )


def _resolved_backend() -> str:
    backend = settings.embedding_backend.strip().lower()
    if backend == "auto":
        return "hash" if _running_on_render() else "sentence-transformers"
    return backend


def get_embedding_backend() -> str:
    return _resolved_backend()


def get_embedding_model_name() -> str:
    if _resolved_backend() == "hash":
        return f"{HASH_EMBEDDING_MODEL_NAME}-{settings.embedding_dimensions}d"
    return SENTENCE_TRANSFORMER_MODEL


def get_model() -> Any:
    global _model
    if _resolved_backend() == "hash":
        return get_embedding_model_name()

    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
    return _model


def _hash_embedding(text: str) -> list[float]:
    vector = [0.0] * settings.embedding_dimensions
    tokens = re.findall(r"[a-z0-9]+", text.lower())

    for token in tokens:
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "big") % settings.embedding_dimensions
        sign = 1.0 if digest[4] & 1 else -1.0
        vector[index] += sign

    length = math.sqrt(sum(value * value for value in vector))
    if not length:
        return vector
    return [value / length for value in vector]


def embed_texts(texts: list[str]) -> list[list[float]]:
    if _resolved_backend() == "hash":
        return [_hash_embedding(text) for text in texts]

    model = get_model()
    embeddings = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return embeddings.tolist()
