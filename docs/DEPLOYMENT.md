# Deployment Guide

This guide ships AskMyPDF as a Railway backend plus a Vercel frontend.

## 1. Prerequisites

1. GitHub account with `NoorRattan/AskMyPDF` pushed to `main`.
2. Railway account at [railway.app](https://railway.app). The free tier is enough.
3. Vercel account at [vercel.com](https://vercel.com). The free tier is enough.
4. Anthropic API key for Claude.

## 2. Deploy Backend To Railway

1. Go to [railway.app](https://railway.app) -> New Project -> Deploy from GitHub repo.
2. Select `NoorRattan/AskMyPDF`.
3. Railway auto-detects the checked-in Railway config for this repo.
4. Go to the service -> Variables tab -> add each variable exactly:

   | Variable | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `ALLOWED_ORIGINS` | `https://askmypdf.vercel.app` |
   | `CHROMA_PATH` | `/app/data/chroma` |
   | `UPLOAD_DIR` | `/app/data/uploads` |

   `PORT` is injected by Railway automatically. Do not set it.

5. Click Deploy. The first build downloads the `all-MiniLM-L6-v2` model, about 90MB from HuggingFace. Watch the logs. The deploy is ready when you see:

   ```text
   INFO:     Application startup complete.
   ```

6. Copy the Railway-assigned URL, for example `https://askmypdf-production.up.railway.app`.
7. Verify the backend:

   ```bash
   curl https://<railway-url>/health
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
   | `VITE_API_URL` | your Railway URL, no trailing slash |

6. Click Deploy.
7. Copy the Vercel URL, for example `https://askmypdf.vercel.app`.

## 4. Update ALLOWED_ORIGINS

Once you have the final Vercel URL:

1. Go to Railway -> your service -> Variables.
2. Update `ALLOWED_ORIGINS` to your exact Vercel URL, with no trailing slash.
3. Redeploy the Railway service.

## 5. Verify End To End

1. Visit your Vercel URL.
2. Upload a PDF.
3. Ask a question.
4. Confirm tokens stream in the chat interface.

## 6. Local Development

See the "Run locally" section in `README.md` for the exact command sequence.
