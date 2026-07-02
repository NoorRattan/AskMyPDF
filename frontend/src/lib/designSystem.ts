export const MAX_ACCENTS = ["#0052FF", "#4D7CFF", "#10B981", "#0F172A", "#64748B"] as const

export const MAX_CARD_CLASSES = [
  "border-[#E2E8F0] shadow-[0_18px_46px_rgba(15,23,42,0.08)]",
  "border-[#BFDBFE] shadow-[0_18px_46px_rgba(0,82,255,0.10)]",
  "border-[#D1FAE5] shadow-[0_18px_46px_rgba(16,185,129,0.10)]",
  "border-[#CBD5E1] shadow-[0_18px_46px_rgba(15,23,42,0.10)]",
  "border-[#DBEAFE] shadow-[0_18px_46px_rgba(77,124,255,0.10)]",
] as const

export function accentAt(index: number): string {
  return MAX_ACCENTS[index % MAX_ACCENTS.length]
}

export function maxCardAt(index: number): string {
  return MAX_CARD_CLASSES[index % MAX_CARD_CLASSES.length]
}
