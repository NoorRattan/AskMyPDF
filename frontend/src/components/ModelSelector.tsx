import { motion, useReducedMotion } from "framer-motion"
import { BrainCircuit, Gauge, Laptop, LockKeyhole, Wifi } from "lucide-react"

import { cn } from "../lib/utils"
import type { ModelOption, ModelPreference } from "../types"

export const fallbackModels: ModelOption[] = [
  {
    id: "offline",
    label: "Offline Local",
    mode: "offline",
    provider: "local",
    model: "askmypdf-offline-extractive-v1",
    available: true,
    description: "Private extractive answers from retrieved PDF chunks. No external LLM call.",
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
  return models?.length ? models : fallbackModels
}

export function ModelSelector({ value, onChange, models, disabled = false, compact = false }: ModelSelectorProps) {
  const shouldReduce = useReducedMotion()
  const options = normalizeModels(models)

  return (
    <div className={cn("model-selector", compact ? "space-y-2" : "space-y-3")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-secondary/70">Model route</p>
          {!compact ? (
            <p className="mt-1 text-sm leading-6 text-secondary">Choose offline privacy or online reasoning before you ask.</p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-surface-raised/70 px-2.5 py-1 font-mono text-[10px] uppercase text-secondary">
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
              transition={{ delay: index * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              whileHover={shouldReduce || unavailable ? undefined : { y: -3, scale: 1.01 }}
              whileTap={shouldReduce || unavailable ? undefined : { scale: 0.98 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border px-3.5 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary",
                compact ? "min-h-[92px]" : "min-h-[104px]",
                selected
                  ? "border-primary/70 bg-primary/12 shadow-[0_18px_50px_rgba(20,184,166,0.14)]"
                  : "border-border/80 bg-surface/55 hover:border-primary/45 hover:bg-surface-raised/70",
                unavailable && "cursor-not-allowed opacity-45",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 w-1 transition-opacity",
                  selected ? "bg-primary opacity-100" : "bg-primary/60 opacity-0 group-hover:opacity-70",
                )}
                aria-hidden="true"
              />
              <span className="relative flex items-start gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition",
                    selected ? "border-primary/45 bg-primary text-white" : "border-border/70 bg-bg/65 text-primary-light",
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-bold text-text">{option.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase",
                        option.mode === "offline" ? "bg-success/12 text-emerald-200" : "bg-amber-400/12 text-amber-200",
                      )}
                    >
                      {option.mode === "online" ? <Wifi size={10} aria-hidden="true" /> : <Laptop size={10} aria-hidden="true" />}
                      {option.mode}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-secondary/75" title={`${option.model} / ${option.provider}`}>
                    {option.model} / {option.provider}
                  </span>
                  {!compact ? <span className="mt-2 block text-xs leading-5 text-secondary/85">{option.description}</span> : null}
                  {!option.available ? <span className="mt-1 block text-xs text-error">API key not configured</span> : null}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
