"""Índices em dim_people.tipo_pessoa e bridge_movie_genre.sk_genre_id.

Adicionados após medir o novo endpoint de dashboard (GET /api/v1/dashboard) na base real:
o ranking de diretores levava ~2,5s (SCAN completo de dim_people, 424,7k linhas, porque o
único índice existente em nome_pessoa/tipo_pessoa tem tipo_pessoa como coluna não-líder) e a
quebra de nota média por gênero levava ~1,6s (sem índice persistente em sk_genre_id, o SQLite
recriava um índice automático em tempo de execução a cada chamada).

Revision ID: 0003_dashboard_indexes
Revises: 0002_add_movie_criado_em
Create Date: 2026-09-25
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0003_dashboard_indexes"
down_revision: str | Sequence[str] | None = "0002_add_movie_criado_em"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("ix_dim_people_tipo_pessoa", "dim_people", ["tipo_pessoa"])
    op.create_index(
        "ix_bridge_movie_genre_sk_genre_id", "bridge_movie_genre", ["sk_genre_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_bridge_movie_genre_sk_genre_id", table_name="bridge_movie_genre")
    op.drop_index("ix_dim_people_tipo_pessoa", table_name="dim_people")
