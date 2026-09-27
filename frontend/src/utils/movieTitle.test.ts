import { describe, expect, it } from 'vitest'

import { movieTitle } from './movieTitle'

describe('movieTitle', () => {
  it('strips a single layer of serialized wrapping quotes', () => {
    expect(movieTitle('""Titanic""')).toBe('Titanic')
  })

  it('unwraps multi-layer serialized quotes from the real CSV data', () => {
    expect(movieTitle('"""satie\'s """"parade"""""""')).toBe('satie\'s "parade"')
  })

  it('leaves a title without wrapping quotes unchanged', () => {
    expect(movieTitle('Duna')).toBe('Duna')
  })

  it('does not touch internal quotes that do not wrap the whole title', () => {
    expect(movieTitle('He said "hi" to everyone')).toBe('He said "hi" to everyone')
  })

  it('falls back to the original title when unwrapping would empty the string', () => {
    expect(movieTitle('""')).toBe('""')
    expect(movieTitle('"')).toBe('"')
  })
})
