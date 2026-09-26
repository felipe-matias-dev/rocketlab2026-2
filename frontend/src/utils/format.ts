export function formatUsdCompact(value: number): string {
  if (value >= 1_000_000_000) return `US$ ${(value / 1_000_000_000).toFixed(1)}bi`
  if (value >= 1_000_000) return `US$ ${(value / 1_000_000).toFixed(1)}mi`
  if (value >= 1_000) return `US$ ${(value / 1_000).toFixed(0)}mil`
  return `US$ ${value.toFixed(0)}`
}
