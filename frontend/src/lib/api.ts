import type {
  ModelPreference,
  SavedAnswer,
  SavedAnswerRequest,
  SystemStatusResponse,
  UploadJobResponse,
  UploadStatusResponse,
} from "../types"

const rawApiUrl = (import.meta.env.DEV ? (import.meta.env.VITE_API_URL ?? "/api") : "/api").replace(/\/+$/, "")
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`

interface ErrorBody {
  error?: string
  detail?: string | Array<{ msg?: string }>
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

  const detail = Array.isArray(body.detail)
    ? body.detail.map((item) => item.msg).filter(Boolean).join(" ")
    : body.detail

  return new APIError(res.status, body.error ?? "request_failed", detail)
}

function requestId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  const headers = new Headers(init.headers)
  headers.set("X-Request-ID", requestId())

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers,
    })
  } finally {
    window.clearTimeout(timer)
  }
}

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  const res = await fetchWithTimeout(`${API_URL}/health`, { method: "GET" }, 8000)

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as SystemStatusResponse
}

export async function uploadPDF(file: File): Promise<UploadJobResponse> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetchWithTimeout(`${API_URL}/upload`, {
    method: "POST",
    body: form,
  }, 45000)

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as UploadJobResponse
}

export async function getUploadStatus(jobId: string): Promise<UploadStatusResponse> {
  const res = await fetchWithTimeout(`${API_URL}/upload/status/${jobId}`, { method: "GET" }, 15000)

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as UploadStatusResponse
}

export async function streamChat(
  sessionId: string,
  question: string,
  modelPreference: ModelPreference = "offline",
): Promise<Response> {
  const res = await fetchWithTimeout(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question, model_preference: modelPreference }),
  }, 90000)

  if (!res.ok) {
    throw await parseError(res)
  }

  return res
}

export async function saveCitedAnswer(payload: SavedAnswerRequest): Promise<SavedAnswer> {
  const res = await fetchWithTimeout(`${API_URL}/saved-answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, 15000)

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as SavedAnswer
}

export async function listSavedAnswers(sessionId: string): Promise<SavedAnswer[]> {
  const res = await fetchWithTimeout(`${API_URL}/sessions/${sessionId}/saved-answers`, { method: "GET" }, 15000)

  if (!res.ok) {
    throw await parseError(res)
  }

  return (await res.json()) as SavedAnswer[]
}
