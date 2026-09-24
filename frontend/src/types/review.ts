export interface Review {
  sk_movie_review_id: string
  nome: string
  nota: number
  comentario: string
  created_at: string
}

export interface ReviewCreateInput {
  nome: string
  nota: number
  comentario: string
}
