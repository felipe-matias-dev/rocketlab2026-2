const EN_TO_PT_GENRE: Record<string, string> = {
  Action: 'Ação',
  Adventure: 'Aventura',
  Animation: 'Animação',
  Comedy: 'Comédia',
  Crime: 'Crime',
  Documentary: 'Documentário',
  Drama: 'Drama',
  Family: 'Família',
  Fantasy: 'Fantasia',
  History: 'História',
  Horror: 'Terror',
  Music: 'Música',
  Mystery: 'Mistério',
  Romance: 'Romance',
  'Science Fiction': 'Ficção Científica',
  Thriller: 'Suspense',
  'Tv Movie': 'Telefilme',
  War: 'Guerra',
  Western: 'Faroeste',
}

/** Traduz um nome de gênero em inglês (dado bruto do seed) para exibição em português.
 * Não afeta filtragem/seleção, que continuam operando por sk_genre_id. */
export function translateGenreName(nameEn: string): string {
  return EN_TO_PT_GENRE[nameEn] ?? nameEn
}
