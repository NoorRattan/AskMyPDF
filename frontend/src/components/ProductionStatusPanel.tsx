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
    description: "Contacting the production API",
    tone: "text-amber-200",
  },
  online: {
    label: "Production online",
    description: "Frontend, API, retrieval, and model routing are connected",
    tone: "text-emerald-200",
  },
  degraded: {
    label: "Runtime degraded",
    description: "The app is reachable, but the backend status check failed",
    tone: "text-rose-200",
  },
} as const

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="font-mono text-[10px] uppercase text-ghost/42">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-ghost" title={value}>
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
      initial={shouldReduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="production-panel relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#10131d]/80 p-4 text-left shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
    >
      <span className="production-aurora production-aurora-a" aria-hidden="true" />
      <span className="production-aurora production-aurora-b" aria-hidden="true" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase text-ghost/48">
            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-300" : "bg-amber-300"}`} aria-hidden="true" />
            Live deployment
          </p>
          <h2 className={`mt-3 text-2xl font-extrabold ${copy.tone}`}>{copy.label}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-ghost/62">{error ?? copy.description}</p>
        </div>

        <div className="production-orbit shrink-0" aria-hidden="true">
          <span className="production-orbit-ring production-orbit-ring-a" />
          <span className="production-orbit-ring production-orbit-ring-b" />
          <span className="production-orbit-core">
            {isOnline ? <ShieldCheck size={25} /> : <Activity size={25} />}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactMetric label="Retrieval" value={details?.embedding_model ?? "checking"} />
        <CompactMetric label="Memory" value={details?.memory_profile ?? "checking"} />
        <CompactMetric label="Offline route" value={details ? `${details.offline_model} / ${details.offline_provider}` : "checking"} />
        <CompactMetric label="Models ready" value={details ? `${availableCount}/${totalModels} available` : "checking"} />
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-ghost/70">
        {[
          { icon: Server, label: "API" },
          { icon: DatabaseZap, label: "Index" },
          { icon: RadioTower, label: "Stream" },
        ].map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            animate={shouldReduce ? undefined : { opacity: isOnline ? [0.62, 1, 0.62] : 0.55 }}
            transition={{ repeat: Infinity, duration: 2.4, delay: index * 0.32, ease: "easeInOut" }}
            className="flex items-center justify-center gap-2 rounded-[1rem] border border-white/8 bg-black/20 px-3 py-2 font-mono text-[11px] uppercase"
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.aside>
  )
}
