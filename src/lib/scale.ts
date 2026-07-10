// Recipe scaling. Ingredient amounts in the data are plain numeric strings
// ("500", "1.5", "0.5") - anything non-numeric passes through untouched.

export const SCALE_OPTIONS = [0.5, 1, 1.5, 2] as const

export function formatScaleLabel(scale: number): string {
  if (scale === 0.5) return '½×'
  if (scale === 1.5) return '1½×'
  return `${scale}×`
}

export function scaleAmount(amount: string, scale: number): string {
  const n = Number(amount)
  if (amount.trim() === '' || !isFinite(n)) return amount
  const v = n * scale
  if (Number.isInteger(v)) return String(v)
  // Baking tolerance: whole numbers are fine above 20 g/ml
  if (v >= 20) return String(Math.round(v))
  const whole = Math.floor(v)
  const frac = v - whole
  if (frac === 0.5) return whole === 0 ? '½' : `${whole}½`
  if (frac === 0.25) return whole === 0 ? '¼' : `${whole}¼`
  if (frac === 0.75) return whole === 0 ? '¾' : `${whole}¾`
  return String(Math.round(v * 10) / 10)
}
