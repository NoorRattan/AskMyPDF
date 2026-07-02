export const MAX_ACCENTS = ["#FF3AF2", "#00F5D4", "#FFE600", "#FF6B35", "#7B2FFF"] as const

export const MAX_CARD_CLASSES = [
  "border-[#FF3AF2] shadow-[0_0_28px_rgba(255,58,242,0.48),8px_8px_0_#FFE600,16px_16px_0_#7B2FFF]",
  "border-[#00F5D4] shadow-[0_0_28px_rgba(0,245,212,0.48),8px_8px_0_#FF6B35,16px_16px_0_#FF3AF2]",
  "border-[#FFE600] shadow-[0_0_28px_rgba(255,230,0,0.42),8px_8px_0_#00F5D4,16px_16px_0_#FF3AF2]",
  "border-[#FF6B35] shadow-[0_0_28px_rgba(255,107,53,0.45),8px_8px_0_#7B2FFF,16px_16px_0_#00F5D4]",
  "border-[#7B2FFF] shadow-[0_0_28px_rgba(123,47,255,0.52),8px_8px_0_#FF3AF2,16px_16px_0_#FFE600]",
] as const

export function accentAt(index: number): string {
  return MAX_ACCENTS[index % MAX_ACCENTS.length]
}

export function maxCardAt(index: number): string {
  return MAX_CARD_CLASSES[index % MAX_CARD_CLASSES.length]
}
