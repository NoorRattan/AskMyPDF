export interface SourceChunk {
  text: string
  page_number: number
  chunk_index: number
}

export type UploadJobStatus = "queued" | "extracting" | "chunking" | "embedding" | "ready" | "error"
export type ModelPreference = "offline" | "fast" | "thinking"

export interface ModelOption {
  id: ModelPreference
  label: string
  mode: "offline" | "online"
  provider: string
  model: string
  available: boolean
  description: string
}

export interface UploadJobResponse {
  job_id: string
  status: UploadJobStatus
  message: string
}

export interface UploadStatusResponse {
  job_id: string
  status: UploadJobStatus
  stage: string
  message: string
  progress: number
  filename: string
  page_count: number | null
  chunk_count: number | null
  session_id: string | null
  error: string | null
}

export interface SystemStatusResponse {
  status: "ok"
  model_loaded: boolean
  embedding_model: string
  embedding_backend: string
  memory_profile: string
  offline_model: string
  offline_provider: string
  fast_model: string
  fast_provider: string
  thinking_model: string
  thinking_provider: string
  available_models: ModelOption[]
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: SourceChunk[]
  modelUsed?: string
  providerUsed?: string
  modeUsed?: "offline" | "online"
  isStreaming: boolean
  timestamp: Date
}

export interface SavedAnswerRequest {
  session_id: string
  question: string
  answer: string
  sources: SourceChunk[]
  model_used?: string
  provider_used?: string
  mode_used?: "offline" | "online"
}

export interface SavedAnswer {
  saved_answer_id: string
  session_id: string
  question: string
  answer: string
  sources: SourceChunk[]
  model_used?: string | null
  provider_used?: string | null
  mode_used?: string | null
  created_at: string
}

export type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "error"

export interface UploadState {
  status: UploadStatus
  jobId: string | null
  sessionId: string | null
  filename: string | null
  pageCount: number | null
  chunkCount: number | null
  stage: UploadJobStatus | null
  progress: number | null
  message: string | null
  error: string | null
}

export interface SSETokenMessage {
  token: string
}

export interface SSEDoneMessage {
  done: true
  sources: SourceChunk[]
  model_used: string
  provider_used: string
  mode_used: "offline" | "online"
}

export type SSEMessage = SSETokenMessage | SSEDoneMessage
