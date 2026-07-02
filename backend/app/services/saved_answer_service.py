from collections import OrderedDict
from datetime import UTC, datetime
from uuid import uuid4

from app.config import settings

SavedAnswer = dict[str, object]

_saved_answers: OrderedDict[str, list[SavedAnswer]] = OrderedDict()


def _trim_session(session_id: str) -> None:
    answers = _saved_answers.get(session_id)
    if answers is None:
        return

    limit = max(1, settings.max_saved_answers_per_session)
    if len(answers) > limit:
        del answers[:-limit]


def save_answer(
    *,
    session_id: str,
    question: str,
    answer: str,
    sources: list[dict],
    model_used: str | None = None,
    provider_used: str | None = None,
    mode_used: str | None = None,
) -> SavedAnswer:
    record: SavedAnswer = {
        "saved_answer_id": uuid4().hex[:16],
        "session_id": session_id,
        "question": question,
        "answer": answer,
        "sources": sources,
        "model_used": model_used,
        "provider_used": provider_used,
        "mode_used": mode_used,
        "created_at": datetime.now(UTC).isoformat(),
    }

    answers = _saved_answers.setdefault(session_id, [])
    answers.append(record)
    _saved_answers.move_to_end(session_id)
    _trim_session(session_id)
    return record


def list_saved_answers(session_id: str) -> list[SavedAnswer]:
    answers = _saved_answers.get(session_id, [])
    if session_id in _saved_answers:
        _saved_answers.move_to_end(session_id)
    return list(reversed(answers))


def delete_saved_answers(session_id: str) -> bool:
    return _saved_answers.pop(session_id, None) is not None
