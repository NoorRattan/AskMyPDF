# AskMyPDF

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-ask--my--pdf--weld.vercel.app-7C3AED)](https://ask-my-pdf-weld.vercel.app)

AskMyPDF is a full-stack PDF chat app: upload a PDF, ask questions, and get streamed answers grounded in the document.

## Live Demo

https://ask-my-pdf-weld.vercel.app

## Why I Built This

I built this because I wanted to understand RAG from first principles, not just wire a library into a notebook and call it done. The constraints were useful: keep deployment practical, preserve real semantic retrieval, and make the final demo feel like a product someone could use. That pushed the project toward clean boundaries, honest citations, streamed responses, and a frontend that feels built instead of assembled.

## How It Works

1. A PDF is uploaded to the FastAPI backend.
2. `/api/upload` creates a background job and returns a `job_id` immediately.
3. The frontend polls `/api/upload/status/{job_id}` while the backend extracts text, chunks the document, and generates embeddings.
4. PyMuPDF is tried first when available, then `pypdf`, then `pdfplumber` for small tricky PDFs.
5. Text is split into 1200-character chunks with no overlap.
6. Each chunk is embedded and normalized. Local/full deployments use `sentence-transformers` with `all-MiniLM-L6-v2`; the free Render demo uses a lightweight hashing backend and a lean production dependency set to stay within memory limits.
7. Chunks and embeddings are stored in a bounded in-memory session store.
8. Questions are embedded with the same semantic model and ranked by cosine similarity.
9. Fast mode streams from Groq using `llama-3.1-8b-instant`.
10. Thinking mode streams from Groq using `llama-3.3-70b-versatile` by default, or from Claude Sonnet 4.6 when an Anthropic key is configured.
11. Every final SSE response includes source chunks plus the actual `model_used` and `provider_used`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 3.4, GSAP, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| PDF parsing | PyMuPDF optional, `pypdf`, `pdfplumber` fallback |
| Retrieval | Configurable normalized embeddings: `all-MiniLM-L6-v2` locally, lightweight hashing on the free Render demo |
| LLM | Groq fast mode + Groq thinking mode by default; optional Anthropic Claude Sonnet 4.6 upgrade |
| Backend deploy | Render |
| Frontend deploy | Vercel |

## Run Locally

```bash
# Backend
git clone https://github.com/NoorRattan/AskMyPDF
cd AskMyPDF/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# then set GROQ_API_KEY; ANTHROPIC_API_KEY is optional
uvicorn app.main:app --port 8000

# Frontend (separate terminal)
cd AskMyPDF/frontend
npm install
cp .env.example .env
npm run dev
```

## Model Modes

Fast mode is optimized for low-latency factual lookups and always uses Groq `llama-3.1-8b-instant`. `GROQ_API_KEY` is the one required LLM secret.

Thinking mode is the quality-oriented path for synthesis, comparison, and multi-part questions. The live deployed demo runs Groq-only by design: Thinking mode uses Groq `llama-3.3-70b-versatile`, keeping the app reliable and cost-conscious while preserving a provider-agnostic LLM layer. If `ANTHROPIC_API_KEY` is configured later, the same code path automatically upgrades Thinking mode to Claude Sonnet 4.6 and reports that in `provider_used`.

## Fair Warning

The backend runs on Render, and free-tier instances can still be CPU constrained or cold-start after inactivity. Uploads no longer block on one long request: the UI gets a job id quickly and shows processing progress while indexing continues.

The live demo is configured with `EMBEDDING_BACKEND=hash` and the Docker image installs `backend/requirements-prod.txt`, which deliberately excludes Torch, sentence-transformers, NumPy, PyMuPDF, and test-only packages. Set `EMBEDDING_BACKEND=sentence-transformers` and install `backend/requirements.txt` on a larger backend if you want the highest retrieval quality.

The frontend also checks `/api/health` at runtime and shows the active embedding backend plus fast/thinking model routes in the live status panel. A live `memory_profile` of `render-512-safe` means the deployed backend is on the lightweight path.

## Known Limitations

- Scanned PDFs are not supported because there is no OCR layer.
- Uploaded sessions are stored in memory and reset when the Render instance restarts or redeploys.
- There is no auth. This is a public portfolio project, not a private document vault.

## License

MIT
