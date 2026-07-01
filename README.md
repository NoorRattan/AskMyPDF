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
6. Each chunk is embedded with `sentence-transformers` using `all-MiniLM-L6-v2` and normalized vectors.
7. Chunks and embeddings are stored in a bounded in-memory session store.
8. Questions are embedded with the same semantic model and ranked by cosine similarity.
9. Fast mode streams from Groq using `llama-3.1-8b-instant`.
10. Thinking mode streams from Anthropic using `claude-sonnet-4-6`.
11. Every final SSE response includes source chunks plus the actual `model_used` and `provider_used`.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 3.4, GSAP, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| PDF parsing | PyMuPDF optional, `pypdf`, `pdfplumber` fallback |
| Retrieval | `sentence-transformers` `all-MiniLM-L6-v2`, normalized in-memory vector ranking |
| LLM | Groq fast mode + Anthropic Claude Sonnet 4.6 thinking mode |
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
# then set ANTHROPIC_API_KEY; optionally set GROQ_API_KEY for Fast mode
uvicorn app.main:app --port 8000

# Frontend (separate terminal)
cd AskMyPDF/frontend
npm install
cp .env.example .env
npm run dev
```

## Model Modes

Fast mode is optimized for low-latency factual lookups and uses Groq when `GROQ_API_KEY` is configured. If that optional key is missing, Fast mode falls back to the Anthropic thinking model and reports the fallback through `provider_used`.

Thinking mode is the quality-oriented path for synthesis, comparison, and multi-part questions. It uses Claude Sonnet 4.6 through Anthropic.

## Fair Warning

The backend runs on Render, and free-tier instances can still be CPU constrained or cold-start after inactivity. Uploads no longer block on one long request: the UI gets a job id quickly and shows processing progress while indexing continues.

## Known Limitations

- Scanned PDFs are not supported because there is no OCR layer.
- Uploaded sessions are stored in memory and reset when the Render instance restarts or redeploys.
- There is no auth. This is a public portfolio project, not a private document vault.

## License

MIT
