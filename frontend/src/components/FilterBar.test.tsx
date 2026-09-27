import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { listDirectors } from '../api/directors'
import type { Genre } from '../types/movie'
import FilterBar, { type FilterBarProps } from './FilterBar'

vi.mock('../api/directors', () => ({
  listDirectors: vi.fn(),
}))

const mockedListDirectors = vi.mocked(listDirectors)

const genres: Genre[] = [
  { sk_genre_id: 'g1', nome_genero: 'Horror' },
  { sk_genre_id: 'g2', nome_genero: 'Comedy' },
]

function baseProps(overrides: Partial<FilterBarProps> = {}): FilterBarProps {
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
    hasActiveFilters: false,
    onClear: vi.fn(),
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('FilterBar', () => {
  it('hides "Limpar filtros" when there are no active filters', () => {
    render(<FilterBar {...baseProps()} />)

    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('calls onClear when "Limpar filtros" is clicked', () => {
    const onClear = vi.fn()
    render(<FilterBar {...baseProps({ hasActiveFilters: true, onClear })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  describe('year range slider', () => {
    it('defaults to the full dataset bounds when no range is set', () => {
      render(<FilterBar {...baseProps()} />)

      expect(screen.getByLabelText('Ano de lançamento mínimo')).toHaveValue('2016')
      expect(screen.getByLabelText('Ano de lançamento máximo')).toHaveValue('2029')
    })

    it('reports a moved lower bound', () => {
      const onYearFromChange = vi.fn()
      render(<FilterBar {...baseProps({ onYearFromChange })} />)

      fireEvent.change(screen.getByLabelText('Ano de lançamento mínimo'), { target: { value: '2020' } })

      expect(onYearFromChange).toHaveBeenCalledWith('2020')
    })

    it('clears the lower bound when dragged back to the dataset minimum', () => {
      const onYearFromChange = vi.fn()
      render(<FilterBar {...baseProps({ yearFrom: '2020', onYearFromChange })} />)

      fireEvent.change(screen.getByLabelText('Ano de lançamento mínimo'), { target: { value: '2016' } })

      expect(onYearFromChange).toHaveBeenCalledWith('')
    })

    it('clamps the lower bound so it never passes the upper bound', () => {
      const onYearFromChange = vi.fn()
      render(<FilterBar {...baseProps({ yearTo: '2020', onYearFromChange })} />)

      fireEvent.change(screen.getByLabelText('Ano de lançamento mínimo'), { target: { value: '2025' } })

      expect(onYearFromChange).toHaveBeenCalledWith('2020')
    })

    it('clamps the upper bound so it never goes below the lower bound', () => {
      const onYearToChange = vi.fn()
      render(<FilterBar {...baseProps({ yearFrom: '2022', onYearToChange })} />)

      fireEvent.change(screen.getByLabelText('Ano de lançamento máximo'), { target: { value: '2018' } })

      expect(onYearToChange).toHaveBeenCalledWith('2022')
    })

    it('clears the upper bound when dragged up to the dataset maximum', () => {
      const onYearToChange = vi.fn()
      render(<FilterBar {...baseProps({ yearTo: '2020', onYearToChange })} />)

      fireEvent.change(screen.getByLabelText('Ano de lançamento máximo'), { target: { value: '2029' } })

      expect(onYearToChange).toHaveBeenCalledWith('')
    })
  })

  describe('rating minimum slider', () => {
    it('shows "Todas as notas" when no minimum is set', () => {
      render(<FilterBar {...baseProps()} />)

      expect(screen.getByText('Todas as notas')).toBeInTheDocument()
    })

    it('shows the chosen minimum', () => {
      render(<FilterBar {...baseProps({ ratingMin: '7' })} />)

      expect(screen.getByText('A partir de 7')).toBeInTheDocument()
    })

    it('reports a moved value', () => {
      const onRatingMinChange = vi.fn()
      render(<FilterBar {...baseProps({ onRatingMinChange })} />)

      fireEvent.change(screen.getByLabelText('Nota mínima'), { target: { value: '6' } })

      expect(onRatingMinChange).toHaveBeenCalledWith('6')
    })

    it('clears the minimum when dragged back to zero', () => {
      const onRatingMinChange = vi.fn()
      render(<FilterBar {...baseProps({ ratingMin: '6', onRatingMinChange })} />)

      fireEvent.change(screen.getByLabelText('Nota mínima'), { target: { value: '0' } })

      expect(onRatingMinChange).toHaveBeenCalledWith('')
    })
  })

  describe('genre combobox', () => {
    it('shows a placeholder summary when nothing is selected', () => {
      render(<FilterBar {...baseProps()} />)

      expect(screen.getByRole('button', { name: 'Todos os gêneros' })).toBeInTheDocument()
    })

    it('pluralizes the summary for more than one selected genre', () => {
      render(<FilterBar {...baseProps({ selectedGenreIds: ['g1', 'g2'] })} />)

      expect(screen.getByRole('button', { name: '2 selecionados' })).toBeInTheDocument()
    })

    it('opens the listbox with translated genre names on click', () => {
      render(<FilterBar {...baseProps()} />)

      fireEvent.click(screen.getByRole('button', { name: 'Todos os gêneros' }))

      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Terror' })).toBeInTheDocument()
    })

    it('closes the listbox when clicking outside', () => {
      render(
        <div>
          <FilterBar {...baseProps()} />
          <button>Fora</button>
        </div>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Todos os gêneros' }))
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      fireEvent.mouseDown(screen.getByRole('button', { name: 'Fora' }))

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('calls onToggleGenre when a genre option is clicked', () => {
      const onToggleGenre = vi.fn()
      render(<FilterBar {...baseProps({ onToggleGenre })} />)

      fireEvent.click(screen.getByRole('button', { name: 'Todos os gêneros' }))
      fireEvent.click(screen.getByRole('option', { name: 'Terror' }))

      expect(onToggleGenre).toHaveBeenCalledWith('g1')
    })
  })

  describe('director filter', () => {
    it('does not fetch suggestions for a single character', async () => {
      render(<FilterBar {...baseProps()} />)

      fireEvent.change(screen.getByLabelText('Filtrar por diretor'), { target: { value: 'N' } })
      await new Promise((resolve) => setTimeout(resolve, 350))

      expect(mockedListDirectors).not.toHaveBeenCalled()
    })

    it('fetches suggestions after the debounce once 2+ characters are typed', async () => {
      mockedListDirectors.mockResolvedValue(['Christopher Nolan'])
      render(<FilterBar {...baseProps()} />)

      fireEvent.change(screen.getByLabelText('Filtrar por diretor'), { target: { value: 'No' } })

      await waitFor(() => expect(mockedListDirectors).toHaveBeenCalledWith({ q: 'No', limit: 8 }), {
        timeout: 1000,
      })
    })

    it('selects a suggestion and reports it as the confirmed filter', async () => {
      mockedListDirectors.mockResolvedValue(['Christopher Nolan'])
      const onDirectorChange = vi.fn()
      render(<FilterBar {...baseProps({ onDirectorChange })} />)

      fireEvent.focus(screen.getByLabelText('Filtrar por diretor'))
      fireEvent.change(screen.getByLabelText('Filtrar por diretor'), { target: { value: 'No' } })
      fireEvent.click(await screen.findByRole('button', { name: 'Christopher Nolan' }, { timeout: 1000 }))

      expect(onDirectorChange).toHaveBeenCalledWith('Christopher Nolan')
      expect(screen.getByLabelText('Filtrar por diretor')).toHaveValue('Christopher Nolan')
    })

    it('clears the confirmed filter when the field is emptied by hand', () => {
      const onDirectorChange = vi.fn()
      render(<FilterBar {...baseProps({ director: 'Christopher Nolan', onDirectorChange })} />)

      fireEvent.change(screen.getByLabelText('Filtrar por diretor'), { target: { value: '' } })

      expect(onDirectorChange).toHaveBeenCalledWith('')
    })

    it('does not report a filter change while still typing', () => {
      const onDirectorChange = vi.fn()
      render(<FilterBar {...baseProps({ onDirectorChange })} />)

      fireEvent.change(screen.getByLabelText('Filtrar por diretor'), { target: { value: 'Nolan' } })

      expect(onDirectorChange).not.toHaveBeenCalled()
    })
  })
})
