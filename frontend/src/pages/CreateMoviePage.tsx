import { useNavigate } from 'react-router-dom'

import { createMovie } from '../api/movies'
import MovieForm from '../components/MovieForm'

function CreateMoviePage() {
  const navigate = useNavigate()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Cadastrar filme</h1>
      <div className="mt-6">
        <MovieForm
          submitLabel="Cadastrar filme"
          onSubmit={createMovie}
          onSuccess={(movie) => navigate(`/movies/${movie.sk_movie_id}`)}
        />
      </div>
    </div>
  )
}

export default CreateMoviePage
