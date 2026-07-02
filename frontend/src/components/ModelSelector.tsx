import { motion, useReducedMotion } from "framer-motion"
import { BrainCircuit, Gauge, Laptop, LockKeyhole, Wifi } from "lucide-react"

import { accentAt, maxCardAt } from "../lib/designSystem"
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
    <div className={cn("model-selector", compact ? "space-y-2" : "space-y-3")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#00F5D4]">Model route</p>
          {!compact ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-[#DCD7FF]">Choose no external AI or an online reasoning model before you ask.</p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-[#FFE600] bg-[#0D0D1A] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-[3px_3px_0_#FF3AF2]">
          <LockKeyhole size={11} aria-hidden="true" />
          PDF scoped
        </span>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1")}>
        {options.map((option, index) => {
          const Icon = modelIcons[option.id]
          const selected = value === option.id
          const unavailable = disabled || !option.available
          const accent = accentAt(index)

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
                "group relative overflow-hidden rounded-2xl border-4 px-3.5 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#FFE600] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0D0D1A]",
                compact ? "min-h-[88px] px-2.5 py-2.5" : "min-h-[112px]",
                selected
                  ? cn("bg-[#0D0D1A]/96", maxCardAt(index))
                  : "border-white/16 bg-[#1B1238]/82 shadow-[4px_4px_0_rgba(255,255,255,0.08)] hover:bg-[#2D1B4E]",
                unavailable && "cursor-not-allowed opacity-45",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 w-2 transition-opacity",
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-70",
                )}
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              />
              <span className="pointer-events-none absolute inset-0 pattern-dots opacity-0 transition-opacity group-hover:opacity-25" aria-hidden="true" />
              <span className={cn("relative flex items-start gap-3", compact && "gap-2")}>
                <span
                  className={cn(
                    "grid shrink-0 place-items-center rounded-xl border-4 transition",
                    compact ? "h-8 w-8" : "h-10 w-10",
                    selected ? "border-white bg-[#0D0D1A] text-white" : "border-white/18 bg-[#0D0D1A]/70 text-white",
                  )}
                  style={{ color: accent, boxShadow: selected ? `4px 4px 0 ${accent}` : undefined }}
                >
                  <Icon size={compact ? 15 : 18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={cn("font-heading font-black text-white", compact && "text-xs leading-tight")}>{option.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider",
                        compact && "hidden sm:inline-flex",
                        option.mode === "offline" ? "border-[#00F5D4] bg-[#00F5D4]/12 text-[#A7FFF4]" : "border-[#FFE600] bg-[#FFE600]/12 text-[#FFF7A0]",
                      )}
                    >
                      {option.mode === "online" ? <Wifi size={10} aria-hidden="true" /> : <Laptop size={10} aria-hidden="true" />}
                      {option.mode === "online" ? "online" : "offline"}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-[#DCD7FF]/80" title={`${option.model} / ${option.provider}`}>
                    {compact ? option.provider : `${option.model} / ${option.provider}`}
                  </span>
                  {!compact ? <span className="mt-2 block text-xs font-semibold leading-5 text-[#DCD7FF]/88">{option.description}</span> : null}
                  {!option.available ? <span className="mt-1 block text-xs font-bold text-[#FCA5A5]">API key not configured</span> : null}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
