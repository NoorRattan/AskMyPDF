from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import RLock


_requests: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_lock = RLock()


def _now() -> float:
    return time.monotonic()


def check_rate_limit(client_id: str, bucket: str, limit: int, window_seconds: int = 60) -> int | None:
    if limit <= 0:
        return None

    timestamp = _now()
    cutoff = timestamp - window_seconds
    key = (client_id, bucket)

    with _lock:
        hits = _requests[key]
        while hits and hits[0] <= cutoff:
            hits.popleft()

        if len(hits) >= limit:
            retry_after = max(1, int(window_seconds - (timestamp - hits[0])) + 1)
            return retry_after

        hits.append(timestamp)
        return None


def reset_rate_limits() -> None:
    with _lock:
        _requests.clear()
