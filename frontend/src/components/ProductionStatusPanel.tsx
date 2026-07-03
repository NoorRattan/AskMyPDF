import { motion, useReducedMotion } from "framer-motion"
import { Activity, DatabaseZap, RadioTower, Server, ShieldCheck } from "lucide-react"

import { accentAt } from "../lib/designSystem"
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
    tone: "text-[#FFE600]",
  },
  online: {
    label: "Production online",
    description: "Frontend, API, retrieval, and model routing are connected",
    tone: "text-[#00F5D4]",
  },
  degraded: {
    label: "Runtime degraded",
    description: "The app is reachable, but the backend status check failed",
    tone: "text-[#FCA5A5]",
  },
} as const

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-white/16 bg-[#0D0D1A]/74 px-4 py-3 shadow-[4px_4px_0_rgba(255,255,255,0.12)]">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white" title={value}>
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
    <motion.aside
      initial={shouldReduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={shouldReduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="production-panel pattern-checker relative overflow-hidden rounded-[2rem] border-4 border-[#FF3AF2] bg-[#0D0D1A]/88 p-4 text-left shadow-[0_0_34px_rgba(255,58,242,0.42),8px_8px_0_#FFE600,16px_16px_0_#7B2FFF] backdrop-blur-2xl"
    >
      <span className="production-aurora production-aurora-a" aria-hidden="true" />
      <span className="production-aurora production-aurora-b" aria-hidden="true" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
            <span className={`h-3 w-3 rounded-full ${isOnline ? "bg-[#00F5D4]" : "bg-[#FFE600]"}`} aria-hidden="true" />
            Live deployment
          </p>
          <h2 className={`mt-3 font-heading text-2xl font-black ${copy.tone}`}>{copy.label}</h2>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/70">{error ?? copy.description}</p>
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
        <CompactMetric label="API" value={details ? "Render backend" : "checking"} />
        <CompactMetric label="Online routes" value={details ? `${availableOnlineCount}/${onlineModels.length} available` : "checking"} />
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
            className="flex items-center justify-center gap-2 rounded-[1rem] border-2 bg-[#2D1B4E]/70 px-3 py-2 font-mono text-[11px] font-black uppercase tracking-wider text-white"
            style={{ borderColor: accentAt(index + 1), boxShadow: `3px 3px 0 ${accentAt(index + 2)}` }}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </motion.div>
        ))}
      </div>
    </motion.aside>
  )
}
