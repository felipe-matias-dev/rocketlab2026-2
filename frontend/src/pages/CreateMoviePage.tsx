import { useNavigate } from 'react-router-dom'

import { createMovie } from '../api/movies'
import MovieForm from '../components/MovieForm'

function CreateMoviePage() {
  const navigate = useNavigate()

  return (
    <div>
      <MovieForm
        submitLabel="Cadastrar filme"
        onSubmit={createMovie}
        onSuccess={(movie) => navigate(`/movies/${movie.sk_movie_id}`)}
      />
    </div>
  )
}

export default CreateMoviePage
