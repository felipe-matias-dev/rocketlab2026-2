import { useNavigate } from 'react-router-dom'

import { createMovie } from '../api/movies'
import MovieForm from '../components/MovieForm'
import { useToast } from '../components/Toast'

function CreateMoviePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  return (
    <div>
      <MovieForm
        submitLabel="Cadastrar filme"
        onSubmit={createMovie}
        onSuccess={(movie) => {
          showToast('Filme cadastrado com sucesso.')
          navigate(`/movies/${movie.sk_movie_id}`)
        }}
      />
    </div>
  )
}

export default CreateMoviePage
