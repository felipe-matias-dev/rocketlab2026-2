import { describe, expect, it } from 'vitest'

import { translateGenreName } from './genreLabels'

describe('translateGenreName', () => {
  it('translates a known English genre to Portuguese', () => {
    expect(translateGenreName('Science Fiction')).toBe('Ficção Científica')
  })

  it('translates a single-word genre', () => {
    expect(translateGenreName('Horror')).toBe('Terror')
  })

  it('falls back to the original name for an unknown genre', () => {
    expect(translateGenreName('Not A Real Genre')).toBe('Not A Real Genre')
  })
})
