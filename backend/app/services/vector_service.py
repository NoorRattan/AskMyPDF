from __future__ import annotations

import chromadb

from app.config import settings

_client: chromadb.PersistentClient | None = None


def _collection_name(session_id: str) -> str:
    return f"session_{session_id}"


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_path)
    return _client


def get_or_create_collection(session_id: str):
    client = get_client()
    return client.get_or_create_collection(
        name=_collection_name(session_id),
        metadata={"hnsw:space": "cosine"},
    )


def session_exists(session_id: str) -> bool:
    name = _collection_name(session_id)
    return any(getattr(collection, "name", collection) == name for collection in get_client().list_collections())


def add_chunks(session_id: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
    collection = get_or_create_collection(session_id)
    collection.add(
        ids=[f"chunk_{chunk['chunk_index']:04d}" for chunk in chunks],
        documents=[chunk["text"] for chunk in chunks],
        embeddings=embeddings,
        metadatas=[
            {
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "char_start": chunk["char_start"],
                "char_end": chunk["char_end"],
            }
            for chunk in chunks
        ],
    )


def query_chunks(session_id: str, query_embedding: list[float], top_k: int) -> list[dict]:
    collection = get_or_create_collection(session_id)
    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
        include=["documents", "metadatas", "distances"],
    )

    return [
        {
            "text": doc,
            "page_number": meta["page_number"],
            "chunk_index": meta["chunk_index"],
            "distance": dist,
        }
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]


def delete_session(session_id: str) -> bool:
    if not session_exists(session_id):
        return False

    get_client().delete_collection(_collection_name(session_id))
    return True
