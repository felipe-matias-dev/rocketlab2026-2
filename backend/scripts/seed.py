"""Carrega os CSVs de data/seed/csv/ no banco SQLite local, em lotes.

Uso: python -m scripts.seed (a partir de backend/, com o venv ativo).
As tabelas são carregadas na ordem exigida pelas foreign keys do schema
estrela (dimensões -> bridges/fato -> reviews); ver README do plano.
"""

from __future__ import annotations

import csv
from collections.abc import Callable, Iterator
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import Table, create_engine, event
from sqlalchemy.engine import Connection

from app.core.config import get_settings
from app.db.base import Base
from app.movies import models  # noqa: F401  Registra as tabelas em Base.metadata

CSV_DIR = Path(__file__).resolve().parent.parent / "data" / "seed" / "csv"
BATCH_SIZE = 2000

ColumnConverters = dict[str, Callable[[str], Any]]


def _empty_to_none(value: str) -> str | None:
    return value if value != "" else None


def _to_int(value: str) -> int | None:
    """Converte para int; alguns CSVs exportam inteiros como '2375.0'."""

    parsed = _empty_to_none(value)
    return int(float(parsed)) if parsed is not None else None


def _to_float(value: str) -> float | None:
    parsed = _empty_to_none(value)
    return float(parsed) if parsed is not None else None


def _to_decimal(value: str) -> Decimal | None:
    parsed = _empty_to_none(value)
    return Decimal(parsed) if parsed is not None else None


def _to_date(value: str) -> date | None:
    parsed = _empty_to_none(value)
    return datetime.strptime(parsed, "%Y-%m-%d").date() if parsed is not None else None


def read_rows(csv_name: str, converters: ColumnConverters) -> Iterator[dict[str, Any]]:
    """Lê um CSV aplicando os conversores por coluna (padrão: string ou None)."""

    path = CSV_DIR / csv_name
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw_row in reader:
            yield {
                column: converters.get(column, _empty_to_none)(value)
                for column, value in raw_row.items()
            }


def load_table(
    connection: Connection, table: Table, csv_name: str, converters: ColumnConverters
) -> int:
    """Insere um CSV inteiro em uma tabela, em lotes de BATCH_SIZE linhas."""

    total = 0
    batch: list[dict[str, Any]] = []
    for row in read_rows(csv_name, converters):
        batch.append(row)
        if len(batch) >= BATCH_SIZE:
            connection.execute(table.insert(), batch)
            total += len(batch)
            batch.clear()
    if batch:
        connection.execute(table.insert(), batch)
        total += len(batch)
    print(f"{table.name}: {total} linhas carregadas de {csv_name}")
    return total


def _sync_database_url() -> str:
    return get_settings().database_url.replace("sqlite+aiosqlite", "sqlite")


def _enable_sqlite_foreign_keys(engine: Any) -> None:
    @event.listens_for(engine, "connect")
    def _set_pragma(dbapi_connection: object, connection_record: object) -> None:
        del connection_record
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def main() -> None:
    engine = create_engine(_sync_database_url())
    _enable_sqlite_foreign_keys(engine)
    tables = Base.metadata.tables

    with engine.begin() as connection:
        load_table(connection, tables["dim_genres"], "dim_genres.csv", {})
        load_table(connection, tables["dim_companies"], "dim_companies.csv", {})
        load_table(
            connection,
            tables["dim_movies"],
            "dim_movies.csv",
            {
                "data_lancamento": _to_date,
                "ano_lancamento": _to_int,
                "duracao_minutos": _to_int,
            },
        )
        load_table(connection, tables["dim_people"], "dim_people.csv", {})

        load_table(connection, tables["bridge_movie_genre"], "bridge_movie_genre.csv", {})
        load_table(connection, tables["bridge_movie_company"], "bridge_movie_company.csv", {})
        load_table(connection, tables["bridge_movie_person"], "bridge_movie_person.csv", {})
        load_table(
            connection,
            tables["fact_movies_performance"],
            "fact_movies_performance.csv",
            {
                "orcamento_usd": _to_decimal,
                "receita_usd": _to_decimal,
                "lucro_usd": _to_decimal,
                "orcamento_brl": _to_decimal,
                "receita_brl": _to_decimal,
                "lucro_brl": _to_decimal,
                "popularidade": _to_float,
                "nota_tmdb": _to_float,
                "qtd_tmdb": _to_int,
                "nota_imdb": _to_float,
                "qtd_imdb": _to_int,
            },
        )

        load_table(
            connection,
            tables["dim_reviews"],
            "dim_reviews.csv",
            {"qtd_avaliacoes_usuarios": _to_int, "nota_media_usuarios": _to_float},
        )
        load_table(
            connection,
            tables["movie_reviews"],
            "movies_reviews.csv",
            {"nota": _to_float},
        )

    engine.dispose()


if __name__ == "__main__":
    main()
