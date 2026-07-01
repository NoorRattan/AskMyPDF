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
| Vector ranking | Normalized in-memory vectors scored by cosine similarity |
| Fast LLM | Groq `llama-3.1-8b-instant` |
| Thinking LLM | Groq `llama-3.3-70b-versatile` by default; Anthropic `claude-sonnet-4-6` optional |
| Deploy | Render backend, Vercel frontend |

## Final Tech Stack

| Concern | Choice |
|---|---|
| Upload UX | Non-blocking upload jobs with polling via `/api/upload/status/{job_id}` |
| Text extraction | PyMuPDF first when installed, then `pypdf`, then `pdfplumber` for small difficult PDFs |
| Chunking | 1200 characters, no overlap |
| Embeddings | Normalized embeddings; MiniLM for local/full environments, hashing for the free Render deployment |
| Retrieval | Bounded in-memory session store with cosine ranking |
| Generation | Groq-primary provider layer with optional Anthropic upgrade for Thinking mode |
| Streaming | Server-sent events with `token` events and final `done` metadata |

## Architectural Decisions

1. Upload processing is asynchronous from the user's perspective. `/api/upload` creates a short-lived in-memory job and returns a `job_id`; the frontend polls status until the backend returns a ready `session_id`.
2. Retrieval quality and deployment reliability are balanced through `EMBEDDING_BACKEND`. Local/full environments use `all-MiniLM-L6-v2`; the free Render deployment uses the hashing backend to avoid transformer-memory crashes during upload processing.
3. Fast and Thinking are deliberate model routes. Fast mode always uses Groq `llama-3.1-8b-instant`. Thinking mode uses Groq `llama-3.3-70b-versatile` by default, and automatically upgrades to Anthropic `claude-sonnet-4-6` only when `ANTHROPIC_API_KEY` is configured. `resolve_model()` is the single source of truth for this rule, and final SSE events report the actual provider and model used.
4. Runtime state is intentionally in memory for this portfolio app. Uploaded sessions and job status are not durable across Render restarts.
5. Scanned PDFs fail fast. OCR is out of scope for the current version.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Yes | Required provider for Fast mode and default Thinking mode |
| `ANTHROPIC_API_KEY` | No | Optional Claude-tier upgrade for Thinking mode |
| `FAST_MODEL` | No | Defaults to `llama-3.1-8b-instant` |
| `FAST_MODEL_PROVIDER` | No | Defaults to `groq` |
| `THINKING_MODEL_GROQ` | No | Defaults to `llama-3.3-70b-versatile` |
| `THINKING_MODEL_ANTHROPIC` | No | Defaults to `claude-sonnet-4-6` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `UPLOAD_DIR` | No | Temporary upload storage path |
| `CHUNK_SIZE` | No | Defaults to `1200` |
| `CHUNK_OVERLAP` | No | Defaults to `0` |
| `EMBEDDING_BACKEND` | No | Defaults to `auto`; Render uses `hash`, local uses `sentence-transformers` |
| `EMBEDDING_DIMENSIONS` | No | Defaults to `256` |
| `TORCH_NUM_THREADS` | No | Defaults to `2` |
