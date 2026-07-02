# AskMyPDF

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-ask--my--pdf--weld.vercel.app-14B8A6)](https://ask-my-pdf-weld.vercel.app)

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
9. The frontend lets the user choose a model route before upload and again before each question.
10. Private Extractive streams an answer from retrieved PDF chunks without calling an external LLM.
11. Fast Online streams from Groq using `llama-3.1-8b-instant`.
12. Deep Online streams from Groq using `llama-3.3-70b-versatile` by default, or from Claude Sonnet 4.6 when an Anthropic key is configured.
13. Every final SSE response includes source chunks plus the actual `model_used`, `provider_used`, and `mode_used`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 3.4, GSAP, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| PDF parsing | PyMuPDF optional, `pypdf`, `pdfplumber` fallback |
| Retrieval | Configurable normalized embeddings: `all-MiniLM-L6-v2` locally, lightweight hashing on the free Render demo |
| LLM | Private extractive local route, Groq fast mode, Groq deep mode by default, optional Anthropic Claude Sonnet 4.6 upgrade |
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
# GROQ_API_KEY enables online modes; ANTHROPIC_API_KEY is optional for Deep Online
uvicorn app.main:app --port 8000

# Frontend (separate terminal)
cd AskMyPDF/frontend
npm install
cp .env.example .env
npm run dev
```

## Model Modes

Private Extractive is the default route. It runs inside the FastAPI backend, uses the retrieved PDF chunks, and streams a cited extractive answer without sending document text to Groq or Anthropic. It is not browser-offline mode; it is the no-external-AI model route for privacy, no-secret local development, and low memory use.

Fast Online is optimized for low-latency factual lookups and uses Groq `llama-3.1-8b-instant`. It is available when `GROQ_API_KEY` is configured.

Deep Online is the quality-oriented path for synthesis, comparison, and multi-part questions. It uses Groq `llama-3.3-70b-versatile` by default, or upgrades to Claude Sonnet 4.6 when `ANTHROPIC_API_KEY` is configured. The API reports the actual route in `model_used`, `provider_used`, and `mode_used`.

## Fair Warning

The backend runs on Render, and free-tier instances can still be CPU constrained or cold-start after inactivity. Uploads no longer block on one long request: the UI gets a job id quickly and shows processing progress while indexing continues.

The live demo is configured with `EMBEDDING_BACKEND=hash` and the Docker image installs `backend/requirements-prod.txt`, which deliberately excludes Torch, sentence-transformers, NumPy, PyMuPDF, and test-only packages. Set `EMBEDDING_BACKEND=sentence-transformers` and install `backend/requirements.txt` on a larger backend if you want the highest retrieval quality.

The frontend also checks `/api/health` at runtime and shows the active embedding backend, private extractive model, and how many model routes are available. A live `memory_profile` of `render-512-safe` means the deployed backend is on the lightweight path.

## Known Limitations

- Scanned PDFs are not supported because there is no OCR layer.
- Uploaded sessions are stored in memory and reset when the Render instance restarts or redeploys.
- There is no auth. This is a public portfolio project, not a private document vault.

## License

MIT
