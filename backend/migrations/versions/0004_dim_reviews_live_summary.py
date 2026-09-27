"""Reaproveita dim_reviews como resumo ao vivo por filme, calculado a partir de movie_reviews.

dim_reviews foi carregada uma única vez a partir do dim_reviews.csv do fornecedor
(~26.605 linhas, nem uma por filme) na carga inicial do seed e nunca mais foi escrita:
nenhum service ou endpoint lê essa tabela hoje, e create_review() nunca a atualiza, então
ela ficou dessincronizada de movie_reviews (~43.667 linhas reais) desde o primeiro seed.
Isso é o que fazia list_movies() e o dashboard recalcularem um GROUP BY completo sobre
movie_reviews a cada chamada, em vez de ler um resumo já pronto.

Esta migração descarta o snapshot antigo do CSV e recalcula qtd_avaliacoes_usuarios/
nota_media_usuarios com um único INSERT...SELECT...GROUP BY sobre movie_reviews: uma
linha por filme com pelo menos uma avaliação. Filmes sem avaliação continuam sem linha
em dim_reviews (o código de leitura já trata isso como "sem avaliações" via
reviews_summary is None). Este é o backfill único; daqui em diante create_review()
mantém a tabela incrementalmente, com um recálculo restrito ao filme avaliado.

sk_review_id das linhas recriadas reaproveita o próprio sk_movie_id: é uma PK interna
que nunca é exposta em nenhum schema/endpoint, então não há motivo para gerar um hash
novo por linha aqui.

downgrade() apenas esvazia a tabela — o upgrade() já descartou o snapshot original do
CSV, então não há como restaurá-lo por aqui; o caminho de recuperação real é rodar
`python -m scripts.seed` de novo.

Revision ID: 0004_dim_reviews_live_summary
Revises: 0003_dashboard_indexes
Create Date: 2026-09-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_dim_reviews_live_summary"
down_revision: str | Sequence[str] | None = "0003_dashboard_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

movie_reviews = sa.table(
    "movie_reviews",
    sa.column("sk_movie_id", sa.String),
    sa.column("nota", sa.Double),
)
dim_reviews = sa.table(
    "dim_reviews",
    sa.column("sk_review_id", sa.String),
    sa.column("sk_movie_id", sa.String),
    sa.column("qtd_avaliacoes_usuarios", sa.Integer),
    sa.column("nota_media_usuarios", sa.Double),
)


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(dim_reviews.delete())
    select_stmt = (
        sa.select(
            movie_reviews.c.sk_movie_id.label("sk_review_id"),
            movie_reviews.c.sk_movie_id,
            sa.func.count().label("qtd_avaliacoes_usuarios"),
            sa.func.avg(movie_reviews.c.nota).label("nota_media_usuarios"),
        ).group_by(movie_reviews.c.sk_movie_id)
    )
    bind.execute(
        dim_reviews.insert().from_select(
            ["sk_review_id", "sk_movie_id", "qtd_avaliacoes_usuarios", "nota_media_usuarios"],
            select_stmt,
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(dim_reviews.delete())
