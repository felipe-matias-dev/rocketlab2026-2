"""Schemas Pydantic da API de filmes."""

from __future__ import annotations

from datetime import date, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
    popularidade: float | None


class GenreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_genre_id: str
    nome_genero: str


class PersonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_person_id: str
    nome_pessoa: str
    tipo_pessoa: str


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_company_id: str
    nome_produtora: str


class PerformanceRead(BaseModel):
    """Métricas de bilheteria/popularidade importadas do CSV (fact_movies_performance)."""

    model_config = ConfigDict(from_attributes=True)

    orcamento_usd: float | None
    receita_usd: float | None
    lucro_usd: float
    popularidade: float | None
    nota_tmdb: float | None
    qtd_tmdb: int | None
    nota_imdb: float | None
    qtd_imdb: int | None


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
    companies: list[CompanyRead]
    reviews: list[ReviewRead]
    nota_media: float | None
    qtd_avaliacoes: int
    performance: PerformanceRead | None


class MovieCreate(BaseModel):
    """Dados de entrada para cadastrar um filme.

    `genre_ids` deve referenciar gêneros já existentes (GET /genres). `diretores`,
    `atores`, `roteiristas` e `produtoras` são texto livre: cada nome busca ou cria a
    pessoa/produtora correspondente (get-or-create case-insensitive, ver
    `service.resolve_people`/`service.resolve_companies`).
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
    diretores: list[str] = Field(default_factory=list)
    atores: list[str] = Field(default_factory=list)
    roteiristas: list[str] = Field(default_factory=list)
    produtoras: list[str] = Field(default_factory=list)

    @field_validator("diretores", "atores", "roteiristas", "produtoras")
    @classmethod
    def _sem_nome_duplicado_ou_vazio(cls, nomes: list[str]) -> list[str]:
        vistos: set[str] = set()
        limpos: list[str] = []
        for nome in nomes:
            nome_limpo = nome.strip()
            if not nome_limpo:
                continue
            chave = nome_limpo.casefold()
            if chave in vistos:
                raise ValueError(f"Nome duplicado: {nome!r}")
            vistos.add(chave)
            limpos.append(nome_limpo)
        return limpos


class MovieUpdate(MovieCreate):
    """Substituição completa dos campos editáveis (PUT). Mesma forma de MovieCreate."""


class ReviewCreate(BaseModel):
    """Dados de entrada para uma nova avaliação. Nota na escala 0-10 (não 1-5)."""

    nome: str = Field(min_length=1, max_length=120)
    nota: float = Field(ge=0, le=10)
    comentario: str = Field(min_length=1, max_length=4000)
