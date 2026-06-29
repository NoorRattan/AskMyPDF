import { useCallback, useState } from "react"

import { APIError, uploadPDF } from "../lib/api"
import type { UploadState } from "../types"

const idleState: UploadState = {
  status: "idle",
  sessionId: null,
  filename: null,
  pageCount: null,
  chunkCount: null,
  error: null,
}

function errorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  return error instanceof Error ? error.message : "Upload failed."
}

export function useUpload(): {
  state: UploadState
  uploadFile: (file: File) => Promise<void>
  reset: () => void
} {
  const [state, setState] = useState<UploadState>(idleState)

  const uploadFile = useCallback(async (file: File) => {
    setState({ ...idleState, status: "uploading", filename: file.name })

    try {
      const response = await uploadPDF(file)
      setState((current) => ({ ...current, status: "processing", error: null }))
      setState({
        status: "ready",
        sessionId: response.session_id,
        filename: response.filename,
        pageCount: response.page_count,
        chunkCount: response.chunk_count,
        error: null,
      })
    } catch (error) {
      setState({
        ...idleState,
        status: "error",
        filename: file.name,
        error: errorMessage(error),
      })
    }
  }, [])

  const reset = useCallback(() => setState(idleState), [])

  return { state, uploadFile, reset }
}
