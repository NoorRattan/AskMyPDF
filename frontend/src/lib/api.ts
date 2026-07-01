import type { ModelPreference, UploadJobResponse, UploadStatusResponse } from "../types"

const rawApiUrl = (import.meta.env.DEV ? (import.meta.env.VITE_API_URL ?? "/api") : "/api").replace(/\/+$/, "")
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`

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

export async function uploadPDF(file: File): Promise<UploadJobResponse> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as UploadJobResponse
}

export async function getUploadStatus(jobId: string): Promise<UploadStatusResponse> {
  const res = await fetch(`${API_URL}/upload/status/${jobId}`)

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as UploadStatusResponse
}

export async function streamChat(
  sessionId: string,
  question: string,
  modelPreference: ModelPreference = "fast",
): Promise<Response> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question, model_preference: modelPreference }),
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return res
}
