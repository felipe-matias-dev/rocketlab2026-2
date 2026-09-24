"""Adiciona dim_movies.criado_em (para ordenação por "adicionados recentemente").

Revision ID: 0002_add_movie_criado_em
Revises: 0001_initial_movie_schema
Create Date: 2026-09-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_movie_criado_em"
down_revision: str | Sequence[str] | None = "0001_initial_movie_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # SQLite recusa ADD COLUMN com default não-constante (CURRENT_TIMESTAMP) via ALTER TABLE
    # simples; batch mode recria a tabela, o que contorna essa limitação.
    with op.batch_alter_table("dim_movies") as batch_op:
        batch_op.add_column(
            sa.Column(
                "criado_em",
                sa.DateTime(),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("dim_movies") as batch_op:
        batch_op.drop_column("criado_em")
