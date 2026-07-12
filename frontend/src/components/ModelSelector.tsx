import { motion, useReducedMotion } from "framer-motion"
import { BrainCircuit, Gauge, Laptop, LockKeyhole, Wifi } from "lucide-react"

import { cn } from "../lib/utils"
import type { ModelOption, ModelPreference } from "../types"

export const fallbackModels: ModelOption[] = [
  {
    id: "offline",
    label: "Backend Only",
    mode: "offline",
    provider: "local",
    model: "askmypdf-offline-extractive-v1",
    available: true,
    description: "Uses retrieved PDF chunks on the backend without an external LLM request.",
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
  const normalized = source.map((model) =>
    model.id === "offline"
      ? {
          ...model,
          label: "Backend Only",
          description: "Uses retrieved PDF chunks on the backend without an external LLM request.",
        }
      : model,
  )
  const hasAvailableOnlineRoute = normalized.some((model) => model.mode === "online" && model.available)

  return hasAvailableOnlineRoute ? normalized.filter((model) => model.mode === "online") : normalized
}

export function selectPreferredModel(current: ModelPreference, models?: ModelOption[] | null): ModelPreference {
  const options = normalizeModels(models)
  const active = options.find((model) => model.id === current)

  if (active?.available) {
    return current
  }

  return (
    options.find((model) => model.id === "fast" && model.available)?.id ??
    options.find((model) => model.available)?.id ??
    current
  )
}

export function ModelSelector({ value, onChange, models, disabled = false, compact = false }: ModelSelectorProps) {
  const shouldReduce = useReducedMotion()
  const options = normalizeModels(models)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent-400">Model route</p>
          {!compact ? (
            <p className="mt-1 text-sm text-ink-400">Choose an answer route before you ask.</p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-400">
          <LockKeyhole size={11} />
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
              initial={shouldReduce ? false : { opacity: 0, y: 8 }}
              animate={shouldReduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduce || unavailable ? undefined : { y: -2 }}
              whileTap={shouldReduce || unavailable ? undefined : { scale: 0.98 }}
              className={cn(
                "group relative overflow-hidden rounded-xl border-2 px-3.5 py-3 text-left outline-none transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
                compact ? "min-h-[80px] px-3 py-2.5" : "min-h-[100px]",
                selected
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-ink-700 bg-ink-800/50 hover:border-ink-600 hover:bg-ink-800",
                unavailable && "cursor-not-allowed opacity-40",
              )}
            >
              <div className={cn("flex items-start gap-3", compact && "gap-2")}>
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-lg border transition",
                    compact ? "h-8 w-8" : "h-9 w-9",
                    selected
                      ? "border-brand-500/40 bg-brand-500/10 text-brand-400"
                      : "border-ink-700 bg-ink-800 text-ink-400 group-hover:text-ink-300",
                  )}
                >
                  <Icon size={compact ? 15 : 17} />
                </div>
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={cn("font-semibold text-ink-100", compact && "text-xs")}>{option.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
                        compact && "hidden sm:inline-flex",
                        option.mode === "offline"
                          ? "border-ink-600 bg-ink-800 text-ink-400"
                          : "border-accent-500/30 bg-accent-500/10 text-accent-400",
                      )}
                    >
                      {option.mode === "online" ? <Wifi size={10} /> : <Laptop size={10} />}
                      {option.mode === "online" ? "online" : "backend"}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-ink-500" title={`${option.model} / ${option.provider}`}>
                    {compact ? option.provider : `${option.model} / ${option.provider}`}
                  </p>
                  {!compact ? <p className="mt-1.5 text-xs leading-5 text-ink-400">{option.description}</p> : null}
                  {!option.available ? <p className="mt-1 text-xs font-medium text-danger">API key not configured</p> : null}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
