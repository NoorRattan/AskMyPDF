# Deployment Guide

This guide ships AskMyPDF as a Render backend plus a Vercel frontend.

## 1. Prerequisites

1. GitHub account with `NoorRattan/AskMyPDF` pushed to `main`.
2. Render account at [render.com](https://render.com). The free tier is enough.
3. Vercel account at [vercel.com](https://vercel.com). The free tier is enough.
4. Groq API key.
5. Anthropic API key only if you want Thinking mode to upgrade to Claude.

## 2. Deploy Backend To Render

1. Go to [render.com](https://render.com) -> New -> Blueprint.
2. Select `NoorRattan/AskMyPDF`.
3. Render auto-detects `render.yaml` in the repo root. The backend service uses `backend` as its root directory, `Dockerfile` as the Dockerfile path, and `.` as the Docker build context.
4. Go to the service -> Variables tab -> add each variable exactly:

   | Variable | Value |
   |---|---|
   | `GROQ_API_KEY` | your Groq key |
   | `ANTHROPIC_API_KEY` | optional; omit to run Thinking mode on Groq 70B |
   | `FAST_MODEL` | `llama-3.1-8b-instant` |
   | `FAST_MODEL_PROVIDER` | `groq` |
   | `THINKING_MODEL_GROQ` | `llama-3.3-70b-versatile` |
   | `THINKING_MODEL_ANTHROPIC` | `claude-sonnet-4-6` |
   | `ALLOWED_ORIGINS` | `https://ask-my-pdf-weld.vercel.app,https://askmypdf.vercel.app,https://ask-my-pdf-git-main-noorrattans-projects.vercel.app,https://ask-my-p3723ujj9-noorrattans-projects.vercel.app` |
   | `ALLOWED_ORIGIN_REGEX` | `^https://ask-my-p(?:df)?[-a-z0-9]*-noorrattans-projects\.vercel\.app$` |
   | `UPLOAD_DIR` | `/app/data/uploads` |
   | `CHUNK_SIZE` | `1200` |
   | `CHUNK_OVERLAP` | `0` |
   | `UPLOAD_EMBEDDING_BATCH_SIZE` | `256` |
   | `TORCH_NUM_THREADS` | `2` |
   | `MAX_SESSIONS` | `20` |
   | `PORT` | `8000` |

   `PORT=8000` matches the Dockerfile command, which starts Uvicorn on port 8000. On a Groq-only deployment, Render startup logs should include `Thinking mode: Llama 3.3 70B via Groq (no Anthropic key set)`.

5. Click Deploy. Watch the logs. The deploy is ready when you see:

   ```text
   INFO:     Application startup complete.
   ```

6. Copy the Render-assigned URL, for example `https://askmypdf-backend.onrender.com`.
7. Verify the backend:

   ```bash
   curl https://<render-url>/health
   ```

   Expected response:

   ```json
   {"status":"ok","model_loaded":true,"embedding_model":"all-MiniLM-L6-v2"}
   ```

## 3. Deploy Frontend To Vercel

1. Go to [vercel.com](https://vercel.com) -> New Project -> Import from GitHub.
2. Select `NoorRattan/AskMyPDF`.
3. Set **Root Directory** to `frontend`.
4. Vercel detects `vercel.json` automatically.
5. Go to Settings -> Environment Variables -> add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | optional for local development; production uses the `/api` Vercel rewrite |

6. Click Deploy.
7. Copy the Vercel URL, for example `https://askmypdf.vercel.app`.

## 4. Update ALLOWED_ORIGINS

Once you have the final Vercel URL:

1. Go to Render -> your service -> Environment.
2. Update `ALLOWED_ORIGINS` to your exact Vercel URL, with no trailing slash. For multiple Vercel domains, use a comma-separated list. Keep `ALLOWED_ORIGIN_REGEX` set if you use generated Vercel preview domains.
3. Redeploy the Render service.

## 5. Verify End To End

1. Visit your Vercel URL.
2. Upload a PDF and confirm the upload panel shows progress through extraction and embedding.
3. Ask a question in Fast mode.
4. Ask a question in Thinking mode.
5. Confirm tokens stream and completed messages show the model/provider that answered.

## 6. Local Development

See the "Run locally" section in `README.md` for the exact command sequence.
