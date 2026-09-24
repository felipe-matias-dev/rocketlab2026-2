"""Schemas Pydantic da API de filmes."""

from __future__ import annotations

from datetime import date, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

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


class MovieCreate(BaseModel):
    """Dados de entrada para cadastrar um filme.

    `genre_ids` deve referenciar gêneros já existentes (GET /genres).
    `diretor` é texto livre: busca ou cria a pessoa em dim_people.
    """

    titulo: str = Field(min_length=1)
    data_lancamento: date | None = None
    ano_lancamento: int | None = None
    duracao_minutos: int | None = None
    status_filme: str | None = None
    sinopse: str | None = None
    url_poster: str | None = None
    url_backdrop: str | None = None
    genre_ids: list[str] = Field(default_factory=list)
    diretor: str | None = None


class MovieUpdate(MovieCreate):
    """Substituição completa dos campos editáveis (PUT). Mesma forma de MovieCreate."""


class ReviewCreate(BaseModel):
    """Dados de entrada para uma nova avaliação. Nota na escala 0-10 (não 1-5)."""

    nome: str = Field(min_length=1, max_length=120)
    nota: float = Field(ge=0, le=10)
    comentario: str = Field(min_length=1, max_length=4000)
