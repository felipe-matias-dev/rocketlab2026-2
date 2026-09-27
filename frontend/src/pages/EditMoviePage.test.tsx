import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { getMovie, updateMovie } from '../api/movies'
import { ToastProvider } from '../components/Toast'
import type { MovieDetail, MovieInput } from '../types/movie'
import EditMoviePage from './EditMoviePage'

vi.mock('../api/movies', () => ({
  getMovie: vi.fn(),
  updateMovie: vi.fn(),
}))

// The form's own behavior is already covered by MovieForm.test.tsx; here we only capture the
// initialValues this page derives, and the submit/success wiring.
vi.mock('../components/MovieForm', () => ({
  default: ({
    initialValues,
    submitLabel,
    onSubmit,
    onSuccess,
  }: {
    initialValues?: MovieInput
    submitLabel: string
    onSubmit: (input: MovieInput) => Promise<MovieDetail>
    onSuccess: (movie: MovieDetail) => void
  }) => (
    <div>
      <p>{submitLabel}</p>
      <p data-testid="diretor">{initialValues?.diretor ?? ''}</p>
      <button
        onClick={async () => {
          const movie = await onSubmit({ ...initialValues, titulo: 'Duna (2021)' } as MovieInput)
          onSuccess(movie)
        }}
      >
        Fake submit
      </button>
    </div>
  ),
}))

const mockedGetMovie = vi.mocked(getMovie)
const mockedUpdateMovie = vi.mocked(updateMovie)

const detail: MovieDetail = {
  sk_movie_id: 'm1',
  id_filme: 'f1',
  titulo: 'Duna',
  data_lancamento: '2021-10-21',
  ano_lancamento: 2021,
  duracao_minutos: 155,
  status_filme: 'Lançado',
  sinopse: 'Sinopse',
  url_poster: null,
  url_backdrop: null,
  genres: [{ sk_genre_id: 'g1', nome_genero: 'Science Fiction' }],
  people: [
    { sk_person_id: 'p1', nome_pessoa: 'Denis Villeneuve', tipo_pessoa: 'Diretor' },
    { sk_person_id: 'p2', nome_pessoa: 'Timothée Chalamet', tipo_pessoa: 'Ator' },
  ],
  companies: [],
  reviews: [],
  nota_media: 8.4,
  qtd_avaliacoes: 3,
  performance: null,
}

function renderPage(movieId = 'm1') {
  const router = createMemoryRouter(
    [
      { path: '/movies/:movieId/edit', element: <EditMoviePage /> },
      { path: '/movies/:movieId', element: <p>Página do filme</p> },
    ],
    { initialEntries: [`/movies/${movieId}/edit`] },
  )
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('EditMoviePage', () => {
  it('shows a loading state before the movie arrives', () => {
    mockedGetMovie.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('shows a not-found message for a 404', async () => {
    mockedGetMovie.mockRejectedValue(new ApiError(404, 'Filme não encontrado'))

    renderPage()

    expect(await screen.findByText('Filme não encontrado.')).toBeInTheDocument()
  })

  it('shows the API error message for a non-404 failure', async () => {
    mockedGetMovie.mockRejectedValue(new ApiError(500, 'Erro interno'))

    renderPage()

    expect(await screen.findByText('Erro interno')).toBeInTheDocument()
  })

  it('extracts the director from the people list for the form', async () => {
    mockedGetMovie.mockResolvedValue(detail)

    renderPage()

    expect(await screen.findByTestId('diretor')).toHaveTextContent('Denis Villeneuve')
  })

  it('saves the movie via updateMovie for this movie id', async () => {
    mockedGetMovie.mockResolvedValue(detail)
    mockedUpdateMovie.mockResolvedValue({ ...detail, titulo: 'Duna (2021)' })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Fake submit' }))

    await waitFor(() =>
      expect(mockedUpdateMovie).toHaveBeenCalledWith('m1', expect.objectContaining({ titulo: 'Duna (2021)' })),
    )
  })

  it('shows a success toast and navigates back to the movie on success', async () => {
    mockedGetMovie.mockResolvedValue(detail)
    mockedUpdateMovie.mockResolvedValue({ ...detail, titulo: 'Duna (2021)' })

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Fake submit' }))

    expect(await screen.findByText('Filme atualizado com sucesso.')).toBeInTheDocument()
    expect(await screen.findByText('Página do filme')).toBeInTheDocument()
  })
})
