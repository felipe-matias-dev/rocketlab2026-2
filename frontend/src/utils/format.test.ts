import { describe, expect, it } from 'vitest'

import { formatUsdCompact } from './format'

describe('formatUsdCompact', () => {
  it('formats billions with one decimal', () => {
    expect(formatUsdCompact(2_500_000_000)).toBe('US$ 2.5bi')
  })

  it('formats millions with one decimal', () => {
    expect(formatUsdCompact(3_200_000)).toBe('US$ 3.2mi')
  })

  it('formats thousands with no decimals', () => {
    expect(formatUsdCompact(45_000)).toBe('US$ 45mil')
  })

  it('formats values under a thousand as plain USD', () => {
    expect(formatUsdCompact(999)).toBe('US$ 999')
  })

  it('formats zero as plain USD', () => {
    expect(formatUsdCompact(0)).toBe('US$ 0')
  })

  it('uses the billions tier starting exactly at one billion', () => {
    expect(formatUsdCompact(1_000_000_000)).toBe('US$ 1.0bi')
  })
})
