# API Reference

Base URL locally: `http://localhost:8000`

Base URL in production: `https://askmypdf-gxwp.onrender.com`

All application endpoints except health are prefixed with `/api`.

## GET /health and /api/health

Checks whether the backend is ready.

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/health
```

Response `200`:

```json
{
  "status": "ok",
  "model_loaded": true,
  "embedding_model": "all-MiniLM-L6-v2",
  "embedding_backend": "sentence-transformers",
  "memory_profile": "semantic-full",
  "offline_model": "askmypdf-offline-extractive-v1",
  "offline_provider": "local",
  "fast_model": "llama-3.1-8b-instant",
  "fast_provider": "groq",
  "thinking_model": "llama-3.3-70b-versatile",
  "thinking_provider": "groq",
  "available_models": [
    {
      "id": "offline",
      "label": "Private Extractive",
      "mode": "offline",
      "provider": "local",
      "model": "askmypdf-offline-extractive-v1",
      "available": true,
      "description": "Runs inside the backend using retrieved PDF chunks only. No Groq, Anthropic, or external AI request is made."
    }
  ]
}
```

The deployed free-tier backend may report `hashing-vectorizer-256d` with `memory_profile` set to `render-512-safe` when configured for the lightweight embedding backend.

The frontend calls `/api/health` through Vercel's rewrite so the browser can display live production status without reaching around the deployed frontend origin.

## POST /api/upload

Uploads a PDF, stores it temporarily, creates an in-memory background processing job, and returns immediately.

Request:

```text
Content-Type: multipart/form-data
Body field: file
```

cURL:

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@/path/to/document.pdf"
```

Success response `200`:

```json
{
  "job_id": "a3f8c2d1e0b4a5f6",
  "status": "queued",
  "message": "Upload received. Processing started."
}
```

Invalid file type `400`:

```json
{
  "error": "invalid_file_type",
  "detail": "Only PDF files are accepted."
}
```

Empty file `400`:

```json
{
  "error": "empty_file",
  "detail": "The uploaded file is empty."
}
```

File too large `413`:

```json
{
  "error": "file_too_large",
  "detail": "File exceeds the 50MB limit."
}
```

Malformed multipart requests return FastAPI's standard `422` validation response.

## GET /api/upload/status/{job_id}

Returns upload processing progress. Poll this endpoint until `status` is `ready` or `error`.

Success response `200`:

```json
{
  "job_id": "a3f8c2d1e0b4a5f6",
  "status": "embedding",
  "stage": "embedding",
  "message": "Generating embeddings (256/1000 chunks)...",
  "progress": 76,
  "filename": "research_paper.pdf",
  "page_count": 24,
  "chunk_count": 1000,
  "session_id": null,
  "error": null
}
```

Ready response:

```json
{
  "job_id": "a3f8c2d1e0b4a5f6",
  "status": "ready",
  "stage": "ready",
  "message": "PDF processed successfully. Ready to chat!",
  "progress": 100,
  "filename": "research_paper.pdf",
  "page_count": 24,
  "chunk_count": 187,
  "session_id": "b4f0c6d9a1e2478a",
  "error": null
}
```

Failure response:

```json
{
  "job_id": "a3f8c2d1e0b4a5f6",
  "status": "error",
  "stage": "error",
  "message": "Failed to extract text. The PDF may be scanned or encrypted.",
  "progress": 100,
  "filename": "scanned.pdf",
  "page_count": null,
  "chunk_count": null,
  "session_id": null,
  "error": "PDF appears to be scanned or has no extractable text."
}
```

Unknown job `404`:

```json
{
  "error": "job_not_found",
  "detail": "Upload job was not found."
}
```

## POST /api/chat

Asks a question about an uploaded PDF. The response is an SSE stream.

Request:

```json
{
  "session_id": "b4f0c6d9a1e2478a",
  "question": "What were the main findings of this study?",
  "model_preference": "offline"
}
```

`model_preference` may be `"offline"`, `"fast"`, or `"thinking"` and defaults to `"offline"`.

- Private Extractive uses `model_preference: "offline"` and does not call Groq, Anthropic, or another external AI provider.
- Fast mode always uses Groq with `llama-3.1-8b-instant`.
- Deep Online uses `model_preference: "thinking"` and routes to Groq `llama-3.3-70b-versatile` by default.
- If `ANTHROPIC_API_KEY` is configured, Deep Online upgrades to Anthropic with `claude-sonnet-4-6`.
- The final SSE `done` message reports the dynamic per-request `model_used`, `provider_used`, and `mode_used`.
- If an online route is selected without the required API key, the API returns `503 model_unavailable` before the SSE stream starts.

cURL:

```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "b4f0c6d9a1e2478a", "question": "What is the main argument?", "model_preference": "offline"}'
```

Response headers:

```text
content-type: text/event-stream
x-accel-buffering: no
```

SSE wire format:

```text
data: {"token": "The"}\n\n
data: {"token": " main"}\n\n
data: {"done": true, "sources": [...], "model_used": "askmypdf-offline-extractive-v1", "provider_used": "local", "mode_used": "offline"}\n\n
```

Final done message shape:

```json
{
  "done": true,
  "sources": [
    {
      "text": "Revenue increased by...",
      "page_number": 3,
      "chunk_index": 42
    }
  ],
  "model_used": "askmypdf-offline-extractive-v1",
  "provider_used": "local",
  "mode_used": "offline"
}
```

Session not found `404`:

```json
{
  "error": "session_not_found",
  "detail": "No PDF has been uploaded for this session. Please upload a PDF first."
}
```

Validation error `422`:

```json
{
  "detail": [
    {
      "type": "string_pattern_mismatch",
      "loc": ["body", "session_id"],
      "msg": "String should match pattern '^[a-f0-9]+$'",
      "input": "not-a-session"
    }
  ]
}
```

Validation also returns `422` when `question` is empty, longer than 1000 characters, or `model_preference` is not `"offline"`, `"fast"`, or `"thinking"`.

Model unavailable `503`:

```json
{
  "error": "model_unavailable",
  "detail": "The selected online model is not configured. Choose Private Extractive or configure the required API key."
}
```

## DELETE /api/session/{session_id}

Deletes an in-memory session. This is the intended cleanup endpoint contract. The current codebase has the vector service helper for this action, but the route is not mounted yet.

cURL:

```bash
curl -X DELETE http://localhost:8000/api/session/b4f0c6d9a1e2478a
```

Success response `200`:

```json
{
  "message": "Session deleted."
}
```

Session not found `404`:

```json
{
  "error": "session_not_found",
  "detail": null
}
```

## CORS

The backend reads allowed origins from the `ALLOWED_ORIGINS` environment variable and splits comma-separated values.

Local development:

```bash
ALLOWED_ORIGINS=http://localhost:5173
```

Production:

```bash
ALLOWED_ORIGINS=https://ask-my-pdf-weld.vercel.app
```

If you use a different Vercel URL or custom domain, update `ALLOWED_ORIGINS` in Render to the exact frontend origin with no trailing slash.
