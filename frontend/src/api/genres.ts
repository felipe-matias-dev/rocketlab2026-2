import { apiClient } from './client'
import type { Genre } from '../types/movie'

export function listGenres(): Promise<Genre[]> {
  return apiClient.get('/genres')
}
