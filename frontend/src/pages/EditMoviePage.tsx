import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import { getMovie, updateMovie } from '../api/movies'
import MovieForm from '../components/MovieForm'
import { useToast } from '../components/Toast'
import type { MovieDetail, MovieInput } from '../types/movie'

/** Converte a ficha completa no formato de entrada do MovieForm — sempre
 * com TODOS os campos, já que PUT /movies/{id} é substituição completa
 * (campo omitido vira null no backend). */
function movieDetailToInput(movie: MovieDetail): MovieInput {
  const diretor = movie.people.find((person) => person.tipo_pessoa === 'Diretor')
  return {
    titulo: movie.titulo,
    data_lancamento: movie.data_lancamento,
    ano_lancamento: movie.ano_lancamento,
    duracao_minutos: movie.duracao_minutos,
    status_filme: movie.status_filme,
    sinopse: movie.sinopse,
    url_poster: movie.url_poster,
    url_backdrop: movie.url_backdrop,
    genre_ids: movie.genres.map((genre) => genre.sk_genre_id),
    diretor: diretor?.nome_pessoa ?? null,
  }
}

function EditMoviePage() {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!movieId) return
    let cancelled = false

    getMovie(movieId)
      .then((result) => {
        if (!cancelled) setMovie(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof ApiError ? err.message : 'Erro ao carregar o filme.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [movieId])

  if (notFound) {
    return <p className="text-ink-muted">Filme não encontrado.</p>
  }
  if (error) {
    return <p className="text-destructive">{error}</p>
  }
  if (movie === null || !movieId) {
    return <p className="text-ink-muted">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Editar filme</h1>
      <div className="mt-6">
        <MovieForm
          initialValues={movieDetailToInput(movie)}
          submitLabel="Salvar alterações"
          onSubmit={(input) => updateMovie(movieId, input)}
          onSuccess={(updated) => {
            showToast('Filme atualizado com sucesso.')
            navigate(`/movies/${updated.sk_movie_id}`)
          }}
        />
      </div>
    </div>
  )
}

export default EditMoviePage
