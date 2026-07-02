import { motion, useReducedMotion } from "framer-motion"
import { BrainCircuit, Gauge, Laptop, LockKeyhole, Wifi } from "lucide-react"

import { cn } from "../lib/utils"
import type { ModelOption, ModelPreference } from "../types"

export const fallbackModels: ModelOption[] = [
  {
    id: "offline",
    label: "Private Extractive",
    mode: "offline",
    provider: "local",
    model: "askmypdf-offline-extractive-v1",
    available: true,
    description: "Server-local extractive answers from retrieved PDF chunks. No Groq, Anthropic, or external AI request.",
  },
  {
    id: "fast",
    label: "Fast Online",
    mode: "online",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    available: true,
    description: "Low-latency Groq route for direct factual questions.",
  },
  {
    id: "thinking",
    label: "Deep Online",
    mode: "online",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    available: true,
    description: "Higher quality synthesis route for comparisons and summaries.",
  },
]

const modelIcons = {
  offline: Laptop,
  fast: Gauge,
  thinking: BrainCircuit,
} as const

interface ModelSelectorProps {
  value: ModelPreference
  onChange: (value: ModelPreference) => void
  models?: ModelOption[] | null
  disabled?: boolean
  compact?: boolean
}

export function normalizeModels(models?: ModelOption[] | null): ModelOption[] {
  const source = models?.length ? models : fallbackModels
  return source.map((model) =>
    model.id === "offline"
      ? {
          ...model,
          label: "Private Extractive",
          description: "Server-local extractive answers from retrieved PDF chunks. No Groq, Anthropic, or external AI request.",
        }
      : model,
  )
}

export function ModelSelector({ value, onChange, models, disabled = false, compact = false }: ModelSelectorProps) {
  const shouldReduce = useReducedMotion()
  const options = normalizeModels(models)

  return (
    <div className={cn("model-selector", compact ? "space-y-3" : "space-y-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Model route</p>
          {!compact ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Choose private offline answers or an online reasoning route before asking.</p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <LockKeyhole size={11} aria-hidden="true" />
          PDF scoped
        </span>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1")}>
        {options.map((option, index) => {
          const Icon = modelIcons[option.id]
          const selected = value === option.id
          const unavailable = disabled || !option.available

          return (
            <motion.button
              key={option.id}
              type="button"
              disabled={unavailable}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              initial={shouldReduce ? false : { opacity: 0, y: 10 }}
              animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduce || unavailable ? undefined : { y: -2 }}
              whileTap={shouldReduce || unavailable ? undefined : { scale: 0.98 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border px-3.5 py-3 text-left outline-none transition duration-200 focus-visible:ring-4 focus-visible:ring-primary/20",
                compact ? "min-h-[92px] px-3 py-3" : "min-h-[118px]",
                selected
                  ? "border-primary/35 bg-blue-50 shadow-[0_14px_32px_rgba(0,82,255,0.12)]"
                  : "border-border bg-white hover:border-primary/25 hover:bg-slate-50",
                unavailable && "cursor-not-allowed opacity-45",
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-light transition-opacity",
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
                aria-hidden="true"
              />
              <span className={cn("relative flex items-start gap-3", compact && "gap-2")}>
                <span
                  className={cn(
                    "grid shrink-0 place-items-center rounded-xl border transition",
                    compact ? "h-9 w-9" : "h-10 w-10",
                    selected ? "border-primary/20 bg-white text-primary" : "border-border bg-muted text-slate-500",
                  )}
                >
                  <Icon size={compact ? 16 : 18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={cn("font-bold text-foreground", compact && "text-sm leading-tight")}>{option.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                        compact && "hidden sm:inline-flex",
                        option.mode === "offline" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-primary",
                      )}
                    >
                      {option.mode === "online" ? <Wifi size={10} aria-hidden="true" /> : <Laptop size={10} aria-hidden="true" />}
                      {option.mode}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground" title={`${option.model} / ${option.provider}`}>
                    {compact ? option.provider : `${option.model} / ${option.provider}`}
                  </span>
                  {!compact ? <span className="mt-2 block text-xs leading-5 text-muted-foreground">{option.description}</span> : null}
                  {!option.available ? <span className="mt-1 block text-xs font-bold text-red-600">API key not configured</span> : null}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
