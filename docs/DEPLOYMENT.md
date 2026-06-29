# Deployment Guide

This guide ships AskMyPDF as a Render backend plus a Vercel frontend.

## 1. Prerequisites

1. GitHub account with `NoorRattan/AskMyPDF` pushed to `main`.
2. Render account at [render.com](https://render.com). The free tier is enough.
3. Vercel account at [vercel.com](https://vercel.com). The free tier is enough.
4. Groq API key.

## 2. Deploy Backend To Render

1. Go to [render.com](https://render.com) -> New -> Blueprint.
2. Select `NoorRattan/AskMyPDF`.
3. Render auto-detects `render.yaml` in the repo root. The backend service uses `backend` as its root directory, `Dockerfile` as the Dockerfile path, and `.` as the Docker build context.
4. Go to the service -> Variables tab -> add each variable exactly:

   | Variable | Value |
   |---|---|
   | `GROQ_API_KEY` | your Groq key |
   | `ALLOWED_ORIGINS` | `https://ask-my-pdf-weld.vercel.app,https://askmypdf.vercel.app` |
   | `CHROMA_PATH` | `/app/data/chroma` |
   | `UPLOAD_DIR` | `/app/data/uploads` |
   | `PORT` | `8000` |

   `PORT=8000` matches the Dockerfile command, which starts Uvicorn on port 8000.

5. Click Deploy. The first build downloads the `all-MiniLM-L6-v2` model, about 90MB from HuggingFace. Watch the logs. The deploy is ready when you see:

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
   {"status":"ok","model_loaded":true}
   ```

## 3. Deploy Frontend To Vercel

1. Go to [vercel.com](https://vercel.com) -> New Project -> Import from GitHub.
2. Select `NoorRattan/AskMyPDF`.
3. Set **Root Directory** to `frontend`.
4. Vercel detects `vercel.json` automatically.
5. Go to Settings -> Environment Variables -> add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | your Render URL, no trailing slash |

6. Click Deploy.
7. Copy the Vercel URL, for example `https://askmypdf.vercel.app`.

## 4. Update ALLOWED_ORIGINS

Once you have the final Vercel URL:

1. Go to Render -> your service -> Environment.
2. Update `ALLOWED_ORIGINS` to your exact Vercel URL, with no trailing slash. For multiple Vercel domains, use a comma-separated list.
3. Redeploy the Render service.

## 5. Verify End To End

1. Visit your Vercel URL.
2. Upload a PDF.
3. Ask a question.
4. Confirm tokens stream in the chat interface.

## 6. Local Development

See the "Run locally" section in `README.md` for the exact command sequence.
