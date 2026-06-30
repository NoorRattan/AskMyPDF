from __future__ import annotations

import hashlib
import math
import re

from app.config import settings

TOKEN_RE = re.compile(r"[a-z0-9]+")


def get_model() -> str:
    return "hashing-vectorizer"


def _tokenize(text: str) -> list[str]:
    return TOKEN_RE.findall(text.lower())


def _embed(text: str) -> list[float]:
    dimensions = settings.embedding_dimensions
    vector = [0.0] * dimensions

    for token in _tokenize(text):
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
        value = int.from_bytes(digest, "big")
        index = value % dimensions
        sign = 1.0 if value & 1 else -1.0
        vector[index] += sign

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector

    return [value / norm for value in vector]


def embed_texts(texts: list[str]) -> list[list[float]]:
    return [_embed(text) for text in texts]
