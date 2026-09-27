import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { listGenres } from '../api/genres'
import type { Genre, MovieDetail, MovieInput } from '../types/movie'
import MovieForm from './MovieForm'

vi.mock('../api/genres', () => ({
  listGenres: vi.fn(),
}))

const mockedListGenres = vi.mocked(listGenres)

const genres: Genre[] = [
  { sk_genre_id: 'g1', nome_genero: 'Action' },
  { sk_genre_id: 'g2', nome_genero: 'Comedy' },
]

const sampleMovie = { sk_movie_id: 'm1', titulo: 'Novo Filme' } as MovieDetail

function renderForm(onSubmit = vi.fn<(input: MovieInput) => Promise<MovieDetail>>()) {
  const onSuccess = vi.fn()
  render(<MovieForm submitLabel="Salvar" onSubmit={onSubmit} onSuccess={onSuccess} />)
  return { onSubmit, onSuccess }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('MovieForm', () => {
  it('shows a required error for título on blur when left empty', () => {
    mockedListGenres.mockResolvedValue([])
    renderForm()

    fireEvent.focus(screen.getByLabelText('Título'))
    fireEvent.blur(screen.getByLabelText('Título'))

    expect(screen.getByText('Título é obrigatório.')).toBeInTheDocument()
  })

  it('rejects an invalid poster URL on blur', () => {
    mockedListGenres.mockResolvedValue([])
    renderForm()

    fireEvent.change(screen.getByLabelText('URL do pôster'), { target: { value: 'not-a-url' } })
    fireEvent.blur(screen.getByLabelText('URL do pôster'))

    expect(screen.getByText('Informe uma URL válida.')).toBeInTheDocument()
  })

  it('blocks submission and does not call onSubmit when título is empty', async () => {
    mockedListGenres.mockResolvedValue([])
    const { onSubmit } = renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Título é obrigatório.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a trimmed, mapped payload and reports success', async () => {
    mockedListGenres.mockResolvedValue(genres)
    const onSubmit = vi.fn().mockResolvedValue(sampleMovie)
    const { onSuccess } = renderForm(onSubmit)

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '  Duna  ' } })
    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '2021' } })
    await screen.findByRole('button', { name: 'Ação' })
    fireEvent.click(screen.getByRole('button', { name: 'Ação' }))

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Duna',
          ano_lancamento: 2021,
          genre_ids: ['g1'],
          diretor: null,
          sinopse: null,
        }),
      ),
    )
    expect(onSuccess).toHaveBeenCalledWith(sampleMovie)
  })

  it('shows the API error message when submission fails', async () => {
    mockedListGenres.mockResolvedValue([])
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(400, 'Filme inválido'))
    renderForm(onSubmit)

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Duna' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Filme inválido')).toBeInTheDocument()
  })
})
