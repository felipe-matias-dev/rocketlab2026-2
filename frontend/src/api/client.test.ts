import { describe, expect, it } from 'vitest'

import { buildQuery } from './client'

describe('buildQuery', () => {
  it('returns an empty string when there are no params', () => {
    expect(buildQuery({})).toBe('')
  })

  it('skips undefined and empty-string values', () => {
    expect(buildQuery({ q: undefined, director: '' })).toBe('')
  })

  it('serializes a single scalar param', () => {
    expect(buildQuery({ page: 2 })).toBe('?page=2')
  })

  it('repeats the key for each item in an array param', () => {
    expect(buildQuery({ genre_ids: ['a', 'b'] })).toBe('?genre_ids=a&genre_ids=b')
  })

  it('omits an empty array entirely', () => {
    expect(buildQuery({ genre_ids: [] })).toBe('')
  })

  it('combines multiple params with &', () => {
    const result = buildQuery({ q: 'matrix', page: 1 })

    expect(result).toBe('?q=matrix&page=1')
  })
})
