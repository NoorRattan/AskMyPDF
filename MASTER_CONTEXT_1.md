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
| Embeddings | `sentence-transformers` 3.0.1 with `all-MiniLM-L6-v2` |
| Vector ranking | Normalized in-memory vectors scored by cosine similarity |
| Fast LLM | Groq `llama-3.1-8b-instant` |
| Thinking LLM | Anthropic `claude-sonnet-4-6` |
| Deploy | Render backend, Vercel frontend |

## Final Tech Stack

| Concern | Choice |
|---|---|
| Upload UX | Non-blocking upload jobs with polling via `/api/upload/status/{job_id}` |
| Text extraction | PyMuPDF first when installed, then `pypdf`, then `pdfplumber` for small difficult PDFs |
| Chunking | 1200 characters, no overlap |
| Embeddings | Semantic MiniLM embeddings normalized at encode time |
| Retrieval | Bounded in-memory session store with cosine ranking |
| Generation | Dual provider: Groq for Fast mode, Anthropic Claude Sonnet 4.6 for Thinking mode |
| Streaming | Server-sent events with `token` events and final `done` metadata |

## Architectural Decisions

1. Upload processing is asynchronous from the user's perspective. `/api/upload` creates a short-lived in-memory job and returns a `job_id`; the frontend polls status until the backend returns a ready `session_id`.
2. Semantic embeddings are required. `all-MiniLM-L6-v2` is the retrieval model because document chat depends on meaning-level similarity, not token-bucket matching.
3. Fast and Thinking are deliberate model routes. Fast mode uses Groq `llama-3.1-8b-instant` for low-latency factual lookups. Thinking mode uses Anthropic `claude-sonnet-4-6` for synthesis and harder analysis. If Fast mode is requested without `GROQ_API_KEY`, the backend falls back to Anthropic and reports the actual provider in the final SSE event.
4. Runtime state is intentionally in memory for this portfolio app. Uploaded sessions and job status are not durable across Render restarts.
5. Scanned PDFs fail fast. OCR is out of scope for the current version.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Thinking mode provider and Fast fallback |
| `GROQ_API_KEY` | No | Enables Fast mode |
| `FAST_MODEL` | No | Defaults to `llama-3.1-8b-instant` |
| `FAST_MODEL_PROVIDER` | No | Defaults to `groq` |
| `THINKING_MODEL` | No | Defaults to `claude-sonnet-4-6` |
| `THINKING_MODEL_PROVIDER` | No | Defaults to `anthropic` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `UPLOAD_DIR` | No | Temporary upload storage path |
| `CHUNK_SIZE` | No | Defaults to `1200` |
| `CHUNK_OVERLAP` | No | Defaults to `0` |
| `TORCH_NUM_THREADS` | No | Defaults to `2` |
