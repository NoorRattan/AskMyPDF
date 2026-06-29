# API Reference

Base URL locally: `http://localhost:8000`

Base URL in production: `https://<render-url>`

All application endpoints except health are prefixed with `/api`.

## GET /health

Checks whether the backend is ready.

```bash
curl http://localhost:8000/health
```

Response `200`:

```json
{
  "status": "ok",
  "model_loaded": true
}
```

`model_loaded` is `true` after the startup event has loaded the sentence-transformers embedding model.

## POST /api/upload

Uploads a PDF and runs the ingestion pipeline.

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
  "session_id": "a3f8c2d1e0b4a5f6",
  "filename": "research_paper.pdf",
  "page_count": 24,
  "chunk_count": 187,
  "message": "PDF processed successfully. Ready to chat!"
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

Processing failed `500`:

```json
{
  "error": "processing_failed",
  "detail": "Failed to extract text. The PDF may be scanned or encrypted."
}
```

Malformed multipart requests return FastAPI's standard `422` validation response.

## POST /api/chat

Asks a question about an uploaded PDF. The response is an SSE stream.

Request:

```json
{
  "session_id": "a3f8c2d1e0b4a5f6",
  "question": "What were the main findings of this study?"
}
```

cURL:

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "a3f8c2d1e0b4a5f6", "question": "What is the main argument?"}' \
  --no-buffer
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
data: {"done": true, "sources": [...]}\n\n
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
  ]
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

Validation also returns `422` when `question` is empty or longer than 1000 characters.

## DELETE /api/session/{session_id}

Deletes a ChromaDB session collection. This is the intended cleanup endpoint contract. The current codebase has the vector service helper for this action, but the route is not mounted yet.

cURL:

```bash
curl -X DELETE http://localhost:8000/api/session/a3f8c2d1e0b4a5f6
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
ALLOWED_ORIGINS=https://askmypdf.vercel.app
```

If you use a different Vercel URL or custom domain, update `ALLOWED_ORIGINS` in Render to the exact frontend origin with no trailing slash.
