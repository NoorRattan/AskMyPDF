import { motion, useReducedMotion } from "framer-motion"
import { Activity, DatabaseZap, RadioTower, Server, ShieldCheck } from "lucide-react"

import type { SystemStatusResponse } from "../types"

interface ProductionStatusPanelProps {
  status: "checking" | "online" | "degraded"
  details: SystemStatusResponse | null
  error: string | null
}

const statusCopy = {
  checking: {
    label: "Checking runtime",
    description: "Contacting the production API.",
    dot: "bg-amber-500",
    tone: "text-amber-700",
  },
  online: {
    label: "Production online",
    description: "Frontend, API, retrieval, and model routing are connected.",
    dot: "bg-emerald-500",
    tone: "text-emerald-700",
  },
  degraded: {
    label: "Runtime degraded",
    description: "The app is reachable, but the backend status check failed.",
    dot: "bg-red-500",
    tone: "text-red-700",
  },
} as const

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-foreground" title={value}>
        {value}
      </p>
    </div>
  )
}

export function ProductionStatusPanel({ status, details, error }: ProductionStatusPanelProps) {
  const shouldReduce = useReducedMotion()
  const copy = statusCopy[status]
  const isOnline = status === "online"
  const availableCount = details?.available_models?.filter((model) => model.available).length ?? 0
  const totalModels = details?.available_models?.length ?? 0

  return (
    <motion.aside
      initial={shouldReduce ? false : { opacity: 0, y: 18 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white/86 p-5 text-left shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${copy.dot}`} aria-hidden="true" />
            Live deployment
          </p>
          <h2 className={`mt-3 text-2xl font-extrabold ${copy.tone}`}>{copy.label}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{error ?? copy.description}</p>
        </div>

        <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-primary" aria-hidden="true">
          <span className="absolute inset-0 rounded-2xl border border-primary/20" />
          <span className="absolute inset-2 rounded-xl border border-primary/20 motion-safe:animate-[process-spin_4s_linear_infinite]" />
          {isOnline ? <ShieldCheck size={25} /> : <Activity size={25} />}
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactMetric label="Retrieval" value={details?.embedding_model ?? "checking"} />
        <CompactMetric label="Memory" value={details?.memory_profile ?? "checking"} />
        <CompactMetric label="Private route" value={details ? `${details.offline_model} / ${details.offline_provider}` : "checking"} />
        <CompactMetric label="Models ready" value={details ? `${availableCount}/${totalModels} available` : "checking"} />
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: Server, label: "API" },
          { icon: DatabaseZap, label: "Index" },
          { icon: RadioTower, label: "Stream" },
        ].map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            animate={shouldReduce ? undefined : { opacity: isOnline ? [0.68, 1, 0.68] : 0.6 }}
            transition={{ repeat: Infinity, duration: 2.8, delay: index * 0.28, ease: "easeInOut" }}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600"
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.aside>
  )
}
