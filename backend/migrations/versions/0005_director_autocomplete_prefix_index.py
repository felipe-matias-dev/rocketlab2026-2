"""Índice em dim_people (tipo_pessoa, lower(nome_pessoa)) para o autocomplete de diretores.

list_directors() usa `nome_pessoa.ilike(...)`, que o SQLAlchemy compila para
`lower(nome_pessoa) LIKE lower(padrão)` no SQLite — o `lower()` em volta da coluna já
impedia o índice simples em nome_pessoa (ix_dim_people_nome_pessoa) de ser usado, então
a busca "contém em qualquer posição" (`%q%`) sempre varria os ~65 mil diretores depois de
filtrar por tipo_pessoa. Junto com esta migração, list_directors() troca `%q%` por `q%`
(prefixo, como a maioria dos autocompletes já funciona) para poder aproveitar um índice.

Medido no banco real: com o índice composto (tipo_pessoa, lower(nome_pessoa)), a busca por
prefixo caiu de ~62ms para ~12ms; a busca "contém" antiga não se beneficia do prefixo do
índice e continuou em ~62ms mesmo com o índice presente — daí a mudança de comportamento
ser necessária, não só o índice sozinho.

Revision ID: 0005_director_autocomplete_prefix_index
Revises: 0004_dim_reviews_live_summary
Create Date: 2026-09-27
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0005_director_autocomplete_prefix_index"
down_revision: str | Sequence[str] | None = "0004_dim_reviews_live_summary"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX ix_dim_people_tipo_pessoa_lower_nome "
        "ON dim_people (tipo_pessoa, lower(nome_pessoa))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX ix_dim_people_tipo_pessoa_lower_nome")
