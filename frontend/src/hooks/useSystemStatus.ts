import { useEffect, useState } from "react"

import { getSystemStatus } from "../lib/api"
import type { SystemStatusResponse } from "../types"

interface SystemStatusState {
  status: "checking" | "online" | "degraded"
  details: SystemStatusResponse | null
  error: string | null
}

export function useSystemStatus(): SystemStatusState {
  const [state, setState] = useState<SystemStatusState>({
    status: "checking",
    details: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const details = await getSystemStatus()

        if (!cancelled) {
          setState({ status: "online", details, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "degraded",
            details: null,
            error: error instanceof Error ? error.message : "Backend status unavailable.",
          })
        }
      }
    }

    void check()
    const timer = window.setInterval(check, 30000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return state
}
