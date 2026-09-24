import { apiClient, buildQuery } from './client'
import type { MovieDetail, MovieInput, MovieListItem, MovieSort, SortOrder } from '../types/movie'
import type { Paginated } from '../types/pagination'
import type { Review, ReviewCreateInput } from '../types/review'

export type ListMoviesParams = {
  page?: number
  page_size?: number
  q?: string
  genre_ids?: string[]
  director?: string
  year_from?: number
  year_to?: number
  rating_min?: number
  rating_max?: number
  sort?: MovieSort
  order?: SortOrder
}

export function listMovies(params: ListMoviesParams = {}): Promise<Paginated<MovieListItem>> {
  return apiClient.get(`/movies${buildQuery(params)}`)
}

export function getMovie(skMovieId: string): Promise<MovieDetail> {
  return apiClient.get(`/movies/${skMovieId}`)
}

export function createMovie(input: MovieInput): Promise<MovieDetail> {
  return apiClient.post('/movies', input)
}

export function updateMovie(skMovieId: string, input: MovieInput): Promise<MovieDetail> {
  return apiClient.put(`/movies/${skMovieId}`, input)
}

export function deleteMovie(skMovieId: string): Promise<void> {
  return apiClient.delete(`/movies/${skMovieId}`)
}

export function createReview(skMovieId: string, input: ReviewCreateInput): Promise<Review> {
  return apiClient.post(`/movies/${skMovieId}/reviews`, input)
}
