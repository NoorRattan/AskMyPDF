from __future__ import annotations

import re
from collections import Counter

STOPWORDS = {
    "a",
    "about",
    "after",
    "all",
    "also",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "been",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "for",
    "from",
    "give",
    "has",
    "have",
    "how",
    "i",
    "in",
    "into",
    "is",
    "it",
    "its",
    "key",
    "list",
    "main",
    "me",
    "of",
    "on",
    "or",
    "that",
    "the",
    "their",
    "this",
    "to",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "would",
    "you",
}


def _tokens(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9]{2,}", text.lower())
        if token not in STOPWORDS
    ]


def _sentences(text: str) -> list[str]:
    candidates = re.split(r"(?<=[.!?])\s+|\n+", text.strip())
    sentences = [re.sub(r"\s+", " ", candidate).strip() for candidate in candidates]
    return [sentence for sentence in sentences if len(sentence) >= 24]


def _trim_sentence(sentence: str, limit: int = 260) -> str:
    if len(sentence) <= limit:
        return sentence

    trimmed = sentence[:limit].rsplit(" ", 1)[0].strip()
    return f"{trimmed}..."


def _is_synthesis_question(question: str) -> bool:
    text = question.lower()
    return any(
        phrase in text
        for phrase in (
            "summarize",
            "summary",
            "key findings",
            "main topics",
            "main points",
            "overview",
            "list",
        )
    )


def build_offline_answer(question: str, chunks: list[dict]) -> str:
    if not chunks:
        return "I couldn't find that in the document."

    question_terms = set(_tokens(question))
    candidates: list[tuple[float, int, int, str]] = []

    for chunk_rank, chunk in enumerate(chunks):
        text = str(chunk.get("text", ""))
        page_number = int(chunk.get("page_number", 0) or 0)
        distance = float(chunk.get("distance", chunk_rank))
        rank_bonus = max(0.0, 1.0 - (chunk_rank * 0.14))
        distance_bonus = max(0.0, 1.0 - distance)

        for sentence_index, sentence in enumerate(_sentences(text) or [_trim_sentence(text)]):
            sentence_terms = _tokens(sentence)
            if not sentence_terms:
                continue

            frequencies = Counter(sentence_terms)
            overlap = sum(frequencies[term] for term in question_terms)
            coverage = overlap / max(len(question_terms), 1)
            density = overlap / max(len(sentence_terms), 1)
            score = (coverage * 3.2) + (density * 1.6) + rank_bonus + distance_bonus
            candidates.append((score, page_number, sentence_index, sentence))

    if not candidates:
        return "I couldn't find that in the document."

    candidates.sort(key=lambda item: item[0], reverse=True)
    minimum_score = 1.0 if question_terms else 0.45
    if candidates[0][0] < minimum_score:
        return "I couldn't find that in the document."

    max_sentences = 3 if _is_synthesis_question(question) else 2
    selected: list[tuple[int, str]] = []
    seen: set[str] = set()

    for score, page_number, _sentence_index, sentence in candidates:
        if score < minimum_score and selected:
            break

        normalized = re.sub(r"[^a-z0-9]+", " ", sentence.lower()).strip()
        fingerprint = " ".join(normalized.split()[:12])
        if fingerprint in seen:
            continue

        seen.add(fingerprint)
        selected.append((page_number, _trim_sentence(sentence)))
        if len(selected) >= max_sentences:
            break

    if not selected:
        return "I couldn't find that in the document."

    cited = " ".join(f"{sentence} (page {page_number})" for page_number, sentence in selected)
    return f"From the document: {cited}"


def stream_text(answer: str) -> list[str]:
    pieces = re.findall(r"\S+\s*", answer)
    return pieces or [answer]
