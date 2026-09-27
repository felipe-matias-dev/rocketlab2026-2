import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Genre } from '../types/movie'
import ActiveFilterChips, { type ActiveFilterChipsProps } from './ActiveFilterChips'

const genres: Genre[] = [{ sk_genre_id: 'g1', nome_genero: 'Horror' }]

function baseProps(overrides: Partial<ActiveFilterChipsProps> = {}): ActiveFilterChipsProps {
  return {
    genres,
    selectedGenreIds: [],
    onToggleGenre: vi.fn(),
    director: '',
    onDirectorChange: vi.fn(),
    yearFrom: '',
    yearTo: '',
    onYearFromChange: vi.fn(),
    onYearToChange: vi.fn(),
    ratingMin: '',
    onRatingMinChange: vi.fn(),
    onClearAll: vi.fn(),
    ...overrides,
  }
}

describe('ActiveFilterChips', () => {
  it('renders nothing when no filter is active', () => {
    const { container } = render(<ActiveFilterChips {...baseProps()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows a translated genre chip and removes it via onToggleGenre', () => {
    const onToggleGenre = vi.fn()
    render(<ActiveFilterChips {...baseProps({ selectedGenreIds: ['g1'], onToggleGenre })} />)

    expect(screen.getByText('Terror')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro: Terror' }))
    expect(onToggleGenre).toHaveBeenCalledWith('g1')
  })

  it('falls back to a generic label for a genre id not in the list', () => {
    render(<ActiveFilterChips {...baseProps({ selectedGenreIds: ['unknown'] })} />)

    expect(screen.getByText('Gênero')).toBeInTheDocument()
  })

  it('shows a director chip and clears it via onDirectorChange', () => {
    const onDirectorChange = vi.fn()
    render(<ActiveFilterChips {...baseProps({ director: 'Nolan', onDirectorChange })} />)

    expect(screen.getByText('Diretor: Nolan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro: Diretor: Nolan' }))
    expect(onDirectorChange).toHaveBeenCalledWith('')
  })

  it('formats a year range with both bounds', () => {
    render(<ActiveFilterChips {...baseProps({ yearFrom: '1990', yearTo: '2000' })} />)

    expect(screen.getByText('Ano: 1990–2000')).toBeInTheDocument()
  })

  it('formats an open-ended year range with only a lower bound', () => {
    render(<ActiveFilterChips {...baseProps({ yearFrom: '1990' })} />)

    expect(screen.getByText('Ano: a partir de 1990')).toBeInTheDocument()
  })

  it('formats an open-ended year range with only an upper bound', () => {
    render(<ActiveFilterChips {...baseProps({ yearTo: '2000' })} />)

    expect(screen.getByText('Ano: até 2000')).toBeInTheDocument()
  })

  it('clears both year bounds when the year chip is removed', () => {
    const onYearFromChange = vi.fn()
    const onYearToChange = vi.fn()
    render(
      <ActiveFilterChips
        {...baseProps({ yearFrom: '1990', yearTo: '2000', onYearFromChange, onYearToChange })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro: Ano: 1990–2000' }))

    expect(onYearFromChange).toHaveBeenCalledWith('')
    expect(onYearToChange).toHaveBeenCalledWith('')
  })

  it('shows a rating chip and clears it via onRatingMinChange', () => {
    const onRatingMinChange = vi.fn()
    render(<ActiveFilterChips {...baseProps({ ratingMin: '7', onRatingMinChange })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remover filtro: Nota: a partir de 7' }))
    expect(onRatingMinChange).toHaveBeenCalledWith('')
  })

  it('calls onClearAll when "Limpar tudo" is clicked', () => {
    const onClearAll = vi.fn()
    render(<ActiveFilterChips {...baseProps({ director: 'Nolan', onClearAll })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Limpar tudo' }))

    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
