"""Cobre a suavização bayesiana da ordenação por nota (sort=rating): sem ela, um filme com
uma única avaliação nota 10 ficaria acima de um com centenas de avaliações nota 9."""

from app.movies.models import DimMovie, DimReview


async def _movie_with_rating(
    session, *, id_filme: str, titulo: str, qtd: int, nota_media: float
) -> str:
    movie = DimMovie(id_filme=id_filme, titulo=titulo)
    session.add(movie)
    await session.flush()
    session.add(
        DimReview(
            sk_movie_id=movie.sk_movie_id,
            qtd_avaliacoes_usuarios=qtd,
            nota_media_usuarios=nota_media,
        )
    )
    await session.commit()
    return movie.sk_movie_id


async def test_rating_sort_pulls_a_single_high_score_toward_the_catalog_average(
    client, session_factory
) -> None:
    async with session_factory() as session:
        # "Baseline" do catálogo: dez filmes com bastante avaliação e nota mediana, pra
        # estabelecer uma média geral realista (~6.5) que não seja dominada pelos dois
        # filmes que o teste quer comparar (o cálculo real, com ~95k filmes, também não é).
        for index in range(10):
            await _movie_with_rating(
                session,
                id_filme=f"baseline-{index}",
                titulo=f"Baseline {index}",
                qtd=50,
                nota_media=6.5,
            )
        few_reviews_id = await _movie_with_rating(
            session, id_filme="few-reviews", titulo="Uma Avaliação Perfeita", qtd=1, nota_media=10.0
        )
        many_reviews_id = await _movie_with_rating(
            session,
            id_filme="many-reviews",
            titulo="Muitas Avaliações Ótimas",
            qtd=200,
            nota_media=9.0,
        )
        no_reviews = DimMovie(id_filme="no-reviews", titulo="Sem Avaliação Nenhuma")
        session.add(no_reviews)
        await session.commit()
        no_reviews_id = no_reviews.sk_movie_id

    response = await client.get(
        "/api/v1/movies", params={"sort": "rating", "order": "desc", "page_size": 50}
    )
    assert response.status_code == 200
    items = response.json()["items"]
    ids = [item["sk_movie_id"] for item in items]
    by_id = {item["sk_movie_id"]: item for item in items}

    # A nota exibida continua a média crua (não a ponderada) — só a ordem muda.
    assert by_id[few_reviews_id]["nota_media"] == 10.0
    assert by_id[many_reviews_id]["nota_media"] == 9.0

    # Sem a suavização, "few_reviews" (nota 10) ficaria antes de "many_reviews" (nota 9).
    # Com ela, a única avaliação perfeita é puxada pra média geral do catálogo e perde
    # para as duzentas avaliações reais em 9.0.
    assert ids.index(many_reviews_id) < ids.index(few_reviews_id)

    # Filme sem avaliação nenhuma sempre por último.
    assert ids[-1] == no_reviews_id


async def test_rating_sort_keeps_unrated_movies_last_regardless_of_direction(
    client, session_factory
) -> None:
    async with session_factory() as session:
        rated_id = await _movie_with_rating(
            session, id_filme="rated", titulo="Filme Avaliado", qtd=10, nota_media=3.0
        )
        unrated = DimMovie(id_filme="unrated", titulo="Filme Sem Nota")
        session.add(unrated)
        await session.commit()
        unrated_id = unrated.sk_movie_id

    desc = await client.get("/api/v1/movies", params={"sort": "rating", "order": "desc"})
    asc = await client.get("/api/v1/movies", params={"sort": "rating", "order": "asc"})

    desc_ids = [item["sk_movie_id"] for item in desc.json()["items"]]
    asc_ids = [item["sk_movie_id"] for item in asc.json()["items"]]

    assert desc_ids[-1] == unrated_id
    assert asc_ids[-1] == unrated_id
    assert rated_id in desc_ids
    assert rated_id in asc_ids
