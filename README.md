# AskMyPDF

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-askmypdf.vercel.app-7C3AED)](https://askmypdf.vercel.app)

AskMyPDF is a full-stack PDF chat app: upload a PDF, ask questions, and get streamed answers grounded in the document.

> ![AskMyPDF screenshot](docs/screenshot.png)
>
> Add a real screenshot here after the first production deploy.

## Live Demo

https://askmypdf.vercel.app

## Why I Built This

I built this because I wanted to understand RAG from first principles, not just wire a library into a notebook and call it done. The constraint was useful: keep costs low beyond the Groq API, use lightweight retrieval that fits on a free deployment, and still make the final demo feel like a real product someone could use. That pushed the project toward the parts I care about most: clean boundaries, honest citations, streaming UX, and a frontend that feels built instead of assembled.

## How It Works

1. A PDF is uploaded to the FastAPI backend.
2. `pdfplumber` extracts text page by page.
3. The text is split into overlapping 500-character chunks.
4. Each chunk is embedded into a compact deterministic hash vector. This uses no external embedding API and no model download.
5. Chunks and embeddings are stored in a bounded in-memory session store.
6. A question is embedded with the same hashing strategy.
7. The backend ranks chunks by vector similarity for that question.
8. Those chunks are passed to Llama 3.3 70B on Groq as context.
9. Groq streams the answer token by token, and the UI shows the cited source chunks.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| PDF parsing | pdfplumber |
| Retrieval | Deterministic hash embeddings, in-memory vector ranking |
| LLM | Llama 3.3 70B Versatile via Groq API |
| Backend deploy | Render |
| Frontend deploy | Vercel |

## Run Locally

```bash
# Backend
git clone https://github.com/NoorRattan/AskMyPDF
cd AskMyPDF/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your GROQ_API_KEY
uvicorn app.main:app --port 8000

# Frontend (separate terminal)
cd AskMyPDF/frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev
```

## Fair Warning (Cold Starts)

> The backend runs on Render's free tier, which spins down after inactivity.
> The first request after sleep can take a bit while Render starts the container.
> Subsequent requests are fast. If the demo feels unresponsive, wait a few
> seconds and try again.

## Known Limitations

- Scanned PDFs are not supported because there is no OCR layer.
- Uploaded sessions are stored in memory and reset when the Render instance restarts or redeploys.
- There is no auth. This is a public portfolio project, not a private document vault.

## License

MIT
