"""Schemas Pydantic da API de filmes."""

from __future__ import annotations

from datetime import date, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    """Envelope de paginação reaproveitado por qualquer listagem."""

    items: list[T]
    total: int
    page: int
    page_size: int


class MovieListItem(BaseModel):
    """Campos exibidos no card do catálogo."""

    sk_movie_id: str
    titulo: str
    ano_lancamento: int | None
    url_poster: str | None
    nota_media: float | None
    qtd_avaliacoes: int


class GenreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_genre_id: str
    nome_genero: str


class PersonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_person_id: str
    nome_pessoa: str
    tipo_pessoa: str


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_movie_review_id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime


class MovieDetail(BaseModel):
    """Ficha completa de um filme: metadados, elenco/equipe e avaliações."""

    sk_movie_id: str
    id_filme: str
    titulo: str
    data_lancamento: date | None
    ano_lancamento: int | None
    duracao_minutos: int | None
    status_filme: str | None
    sinopse: str | None
    url_poster: str | None
    url_backdrop: str | None
    genres: list[GenreRead]
    people: list[PersonRead]
    reviews: list[ReviewRead]
    nota_media: float | None
    qtd_avaliacoes: int
