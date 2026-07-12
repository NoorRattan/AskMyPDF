import { motion, useReducedMotion } from "framer-motion"
import { Activity, DatabaseZap, RadioTower, Server, ShieldCheck } from "lucide-react"

import type { SystemStatusResponse } from "../types"

interface ProductionStatusPanelProps {
  status: "checking" | "online" | "degraded"
  details: SystemStatusResponse | null
  error: string | null
}

const statusCopy = {
  checking: { label: "Checking runtime", tone: "text-warning" },
  online: { label: "Production online", tone: "text-success" },
  degraded: { label: "Runtime degraded", tone: "text-danger" },
} as const

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800/40 px-3.5 py-2.5" style={{ transform: "translateZ(15px)" }}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-ink-200" title={value}>
        {value}
      </p>
    </div>
  )
}

export function ProductionStatusPanel({ status, details, error }: ProductionStatusPanelProps) {
  const shouldReduce = useReducedMotion()
  const copy = statusCopy[status]
  const isOnline = status === "online"
  const onlineModels = details?.available_models?.filter((model) => model.mode === "online") ?? []
  const availableOnlineCount = onlineModels.filter((model) => model.available).length

  return (
    <motion.div
      initial={shouldReduce ? false : { opacity: 0, y: 14, rotateX: -6 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformStyle: "preserve-3d" }}
      className="perspective-near glass relative overflow-hidden rounded-2xl border border-ink-700 p-4"
    >
      <div style={{ transform: "translateZ(25px)" }} className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-500">
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-success" : "bg-warning"} ${!shouldReduce ? "animate-pulse-soft" : ""}`} />
            Live deployment
          </p>
          <h2 className={`mt-2 text-lg font-bold ${copy.tone}`}>{copy.label}</h2>
          <p className="mt-1 max-w-md text-sm text-ink-400">{error ?? (isOnline ? "All systems connected" : "Contacting backend...")}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800">
          {isOnline ? <ShieldCheck size={20} className="text-success" /> : <Activity size={20} className="text-warning" />}
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Retrieval" value={details?.embedding_model ?? "checking"} />
        <Metric label="Memory" value={details?.memory_profile ?? "checking"} />
        <Metric label="API" value={details ? "Render backend" : "checking"} />
        <Metric label="Online routes" value={details ? `${availableOnlineCount}/${onlineModels.length} available` : "checking"} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Server, label: "API" },
          { icon: DatabaseZap, label: "Index" },
          { icon: RadioTower, label: "Stream" },
        ].map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            animate={shouldReduce ? undefined : { opacity: isOnline ? [0.6, 1, 0.6] : 0.5 }}
            transition={{ repeat: Infinity, duration: 2.4, delay: index * 0.3, ease: "easeInOut" }}
            className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-400"
          >
            <Icon size={13} />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
