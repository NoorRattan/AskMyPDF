# AskMyPDF Master Context

## Product

AskMyPDF is a portfolio RAG application for conversational PDF intelligence. Users upload a PDF, wait for a background ingestion job to finish, then ask natural-language questions and receive streamed, cited answers grounded in retrieved document chunks.

## Tech Stack With Versions

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Vite |
| Styling | Tailwind CSS 3.4.17, GSAP 3, Framer Motion |
| Backend | FastAPI 0.111.1, Python 3.11 |
| PDF parsing | PyMuPDF 1.24.9 on Linux when available, `pypdf` 4.3.1, `pdfplumber` 0.11.1 fallback |
| Embeddings | Configurable: `sentence-transformers` 3.0.1 with `all-MiniLM-L6-v2`, or lightweight hashing for memory-constrained deploys |
| Vector ranking | Normalized in-memory vectors stored as compact float arrays and scored by cosine similarity |
| Backend Only LLM | Local extractive route `askmypdf-offline-extractive-v1` |
| Fast LLM | Groq `llama-3.1-8b-instant` |
| Deep LLM | Groq `llama-3.3-70b-versatile` by default; Anthropic `claude-sonnet-4-6` optional |
| Deploy | Render backend, Vercel frontend |

## Final Tech Stack

| Concern | Choice |
|---|---|
| Upload UX | Non-blocking upload jobs with polling via `/api/upload/status/{job_id}` |
| Text extraction | PyMuPDF first when installed, then `pypdf`, then `pdfplumber` for small difficult PDFs |
| Chunking | 1200 characters, no overlap |
| Embeddings | Normalized embeddings; MiniLM for local/full environments, hashing plus lean dependencies for the free Render deployment |
| Retrieval | Bounded in-memory session store with compact vectors and top-k cosine ranking |
| Generation | Backend-only extractive route plus Groq/Anthropic online provider layer |
| Streaming | Server-sent events with `token` events and final `done` metadata |
| Observability | Raw `/health` is minimal; browser-facing `/api/health` returns embedding and model route status |
| Abuse controls | In-process IP rate limits on upload and chat routes; CI runs backend tests and frontend build |

## Architectural Decisions

1. Upload processing is asynchronous from the user's perspective. `/api/upload` creates a short-lived in-memory job and returns a `job_id`; the frontend polls status until the backend returns a ready `session_id`.
2. Retrieval quality and deployment reliability are balanced through `EMBEDDING_BACKEND`. Local/full environments use `all-MiniLM-L6-v2`; the free Render deployment uses the hashing backend and `backend/requirements-prod.txt` to avoid transformer-memory crashes and 512 MB dependency pressure.
3. Backend Only, Fast, and Deep are deliberate model routes. Backend Only uses local retrieved chunks and never calls an external LLM. Fast mode uses Groq `llama-3.1-8b-instant`. Deep mode uses Groq `llama-3.3-70b-versatile` by default, and automatically upgrades to Anthropic `claude-sonnet-4-6` only when `ANTHROPIC_API_KEY` is configured. `resolve_model()` is the single source of truth for this rule, and final SSE events report the actual provider, model, and online/offline mode used.
4. Runtime state is intentionally in memory for this portfolio app. Uploaded sessions and job status are not durable across Render restarts. Completed/failed upload jobs expire by `UPLOAD_JOB_TTL_SECONDS`, uploaded temp files are deleted after processing, and `DELETE /api/session/{session_id}` removes a session plus saved answers.
5. Scanned PDFs fail fast. OCR is out of scope for the current version.
6. The frontend status panel uses `/api/health` through the Vercel rewrite. Raw `/health` stays minimal for production health checks, and FastAPI `/docs`, `/redoc`, and `/openapi.json` stay disabled unless `ENABLE_API_DOCS=true`.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | No | Enables Fast Online and Groq-backed Deep Online |
| `ANTHROPIC_API_KEY` | No | Optional Claude-tier upgrade for Deep Online |
| `OFFLINE_MODEL` | No | Defaults to `askmypdf-offline-extractive-v1` |
| `FAST_MODEL` | No | Defaults to `llama-3.1-8b-instant` |
| `FAST_MODEL_PROVIDER` | No | Defaults to `groq` |
| `THINKING_MODEL_GROQ` | No | Defaults to `llama-3.3-70b-versatile` for Deep Online |
| `THINKING_MODEL_ANTHROPIC` | No | Defaults to `claude-sonnet-4-6` for Deep Online |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `UPLOAD_DIR` | No | Temporary upload storage path |
| `UPLOAD_JOB_TTL_SECONDS` | No | Defaults to `3600`; expires completed/failed upload jobs |
| `RATE_LIMIT_ENABLED` | No | Defaults to `true` |
| `UPLOAD_RATE_LIMIT_PER_MINUTE` | No | Defaults to `5` per client IP |
| `CHAT_RATE_LIMIT_PER_MINUTE` | No | Defaults to `10` per client IP |
| `ENABLE_API_DOCS` | No | Defaults to `false`; gates `/docs`, `/redoc`, and `/openapi.json` |
| `CHUNK_SIZE` | No | Defaults to `1200` |
| `CHUNK_OVERLAP` | No | Defaults to `0` |
| `EMBEDDING_BACKEND` | No | Defaults to `auto`; Render uses `hash`, local uses `sentence-transformers` |
| `EMBEDDING_DIMENSIONS` | No | Defaults to `256` |
| `TORCH_NUM_THREADS` | No | Defaults to `2` |
