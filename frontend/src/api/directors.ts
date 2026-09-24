import { apiClient, buildQuery } from './client'

export type ListDirectorsParams = {
  q?: string
  limit?: number
}

export function listDirectors(params: ListDirectorsParams = {}): Promise<string[]> {
  return apiClient.get(`/directors${buildQuery(params)}`)
}
