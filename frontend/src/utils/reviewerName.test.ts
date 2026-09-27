import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getReviewerName, setReviewerName } from './reviewerName'

describe('reviewerName', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when no name was ever set', () => {
    expect(getReviewerName()).toBeNull()
  })

  it('returns the name previously set', () => {
    setReviewerName('Ana')

    expect(getReviewerName()).toBe('Ana')
  })

  it('overwrites a previously stored name', () => {
    setReviewerName('Ana')
    setReviewerName('Bruno')

    expect(getReviewerName()).toBe('Bruno')
  })

  it('does not throw when sessionStorage.setItem is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked storage')
    })

    expect(() => setReviewerName('Ana')).not.toThrow()
  })

  it('returns null when sessionStorage.getItem is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked storage')
    })

    expect(getReviewerName()).toBeNull()
  })
})
