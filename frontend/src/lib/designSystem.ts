export const ACCENTS = ["#3B82F6", "#22D3EE", "#818CF8"] as const

export function accentAt(index: number): string {
  return ACCENTS[index % ACCENTS.length]
}
