import type { UploadResponse } from "../types"

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")

interface ErrorBody {
  error?: string
  detail?: string
}

export class APIError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    detail?: string,
  ) {
    super(detail ?? code)
    this.name = "APIError"
  }
}

async function parseError(res: Response): Promise<APIError> {
  let body: ErrorBody = {}

  try {
    body = (await res.json()) as ErrorBody
  } catch {
    body = {}
  }

  return new APIError(res.status, body.error ?? "request_failed", body.detail)
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as UploadResponse
}

export async function streamChat(sessionId: string, question: string): Promise<Response> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question }),
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return res
}
