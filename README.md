# AskMyPDF

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-ask--my--pdf--weld.vercel.app-14B8A6)](https://ask-my-pdf-weld.vercel.app)

AskMyPDF is a full-stack PDF chat app: upload a PDF, ask questions, and get streamed answers grounded in the document with citations.

## Live Demo

https://ask-my-pdf-weld.vercel.app

The deployed app works online through a Vercel frontend and a Render FastAPI backend. The production API is reached through the frontend's `/api` rewrite, so browser requests stay on the same public site origin.

Current public model routes:

| Route | Provider | Model | Purpose |
|---|---|---|---|
| Fast Online | Groq | `llama-3.1-8b-instant` | Low-latency factual answers |
| Deep Online | Groq by default, Anthropic when configured | `llama-3.3-70b-versatile` or `claude-sonnet-4-6` | Higher-effort summaries, comparisons, and synthesis |

The backend still includes a backend-only extractive fallback for local development, tests, and deployments without online keys. It is not a user-local runtime, so the public UI no longer presents it as a model card when online routes are available.

> Data handling: PDFs are processed temporarily for the active session. Online routes send only retrieved PDF excerpts to the selected LLM provider, and completed responses report the actual provider/model used. Provider references: [Groq Your Data](https://console.groq.com/docs/your-data) and [Anthropic API data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention).

## Why I Built This

I built this because I wanted to understand RAG from first principles, not just wire a library into a notebook and call it done. The constraints were useful: keep deployment practical, preserve real retrieval behavior, and make the final demo feel like a product someone could use. That pushed the project toward clean boundaries, honest citations, streamed responses, and a frontend that feels built instead of assembled.

## How It Works

1. A PDF is uploaded to the FastAPI backend.
2. `/api/upload` creates a background job and returns a `job_id` immediately.
3. The frontend polls `/api/upload/status/{job_id}` while the backend extracts text, chunks the document, and generates embeddings.
4. PyMuPDF is tried first when available, then `pypdf`, then `pdfplumber` for small tricky PDFs.
5. Text is split into 1200-character chunks with no overlap.
6. Each chunk is embedded and normalized. Local/full deployments use `sentence-transformers` with `all-MiniLM-L6-v2`; the free Render demo uses a lightweight hashing backend and a lean production dependency set to stay within memory limits.
7. Chunks and embeddings are stored in a bounded in-memory session store.
8. Questions are embedded with the same backend and ranked by cosine similarity.
9. The frontend lets the user choose Fast Online or Deep Online before upload and before each question.
10. Answers stream through Server-Sent Events and include cited source chunks.
11. The final SSE event includes `model_used`, `provider_used`, and `mode_used` so the UI shows which route actually answered.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 3.4, GSAP, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| PDF parsing | PyMuPDF optional, `pypdf`, `pdfplumber` fallback |
| Retrieval | Configurable normalized embeddings: `all-MiniLM-L6-v2` locally, lightweight hashing on the free Render demo |
| LLM routes | Groq Fast Online, Groq Deep Online by default, optional Anthropic Claude Sonnet upgrade |
| Backend deploy | Render |
| Frontend deploy | Vercel |

## Run Locally

Backend:

```bash
git clone https://github.com/NoorRattan/AskMyPDF
cd AskMyPDF/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8000
```

Frontend in a separate terminal:

```bash
cd AskMyPDF/frontend
npm install
cp .env.example .env
npm run dev
```

Set `GROQ_API_KEY` in `backend/.env` to enable Fast Online and Groq-backed Deep Online locally. Set `ANTHROPIC_API_KEY` only if you want Deep Online to route to Claude instead.

## Model Routing

Fast Online is optimized for low-latency factual lookups and uses Groq `llama-3.1-8b-instant`.

Deep Online is the quality-oriented path for synthesis, comparison, and multi-part questions. It uses Groq `llama-3.3-70b-versatile` by default, or upgrades to Claude Sonnet 4.6 when `ANTHROPIC_API_KEY` is configured.

The backend-only fallback uses retrieved PDF chunks and a local extractive answer path without calling Groq or Anthropic. It remains available through `model_preference: "offline"` for tests and no-key local development, but the deployed UI hides it when online routes are configured.

## Production Behavior

The live demo is configured with:

- `EMBEDDING_BACKEND=hash`
- `memory_profile=render-512-safe`
- `backend/requirements-prod.txt` in the Render Docker image
- Vercel `/api` rewrites to the Render backend

That production profile deliberately excludes Torch, sentence-transformers, NumPy, PyMuPDF, and test-only packages so the free Render instance stays within its memory budget. Use a larger backend and `EMBEDDING_BACKEND=sentence-transformers` with `backend/requirements.txt` if you want the full local semantic stack in production.

## Production Guardrails

- `/api/upload` is IP-rate-limited to 5 requests per minute by default.
- `/api/chat` is IP-rate-limited to 10 requests per minute by default.
- Raw `/health` returns only minimal readiness; `/api/health` is the browser-facing status contract.
- FastAPI `/docs`, `/redoc`, and `/openapi.json` are disabled unless `ENABLE_API_DOCS=true`.
- Completed and failed upload jobs expire after `UPLOAD_JOB_TTL_SECONDS`, and uploaded temp files are removed after processing.
- `DELETE /api/session/{session_id}` removes an in-memory PDF session and its saved answers.
- GitHub Actions runs backend tests and the frontend production build on push and pull request.

## Known Limitations

- Scanned PDFs are not supported because there is no OCR layer.
- Uploaded sessions are stored in memory and reset when the Render instance restarts, redeploys, expires old sessions, or receives a session delete request.
- There is no auth. This is a public portfolio project with basic abuse controls, not a private document vault.

## License

MIT
