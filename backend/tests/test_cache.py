"""Cobre o cache de respostas (app/movies/cache.py): hit até uma escrita invalidar, e que
chaves de cache distintas (filtros diferentes, filme diferente) não colidem entre si."""

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.movies.models import DimGenre, DimMovie, MovieReview


async def test_public_reads_use_cache_until_review_invalidates_it(client, session_factory) -> None:
    async with session_factory() as session:
        movie = DimMovie(id_filme="cache-1", titulo="Original")
        session.add(movie)
        await session.commit()
        movie_id = movie.sk_movie_id

    list_params = {"sort": "title", "order": "asc"}
    detail_url = f"/api/v1/movies/{movie_id}"

    async def first_listed_title() -> str:
        response = await client.get("/api/v1/movies", params=list_params)
        return response.json()["items"][0]["titulo"]

    assert await first_listed_title() == "Original"
    assert (await client.get(detail_url)).json()["titulo"] == "Original"

    # Muda o banco "por fora" da API (sem passar por update_movie/movie_cache.invalidate()).
    async with session_factory() as session:
        stored = await session.get(DimMovie, movie_id)
        stored.titulo = "Mudou no banco"
        session.add(MovieReview(sk_movie_id=movie_id, nome="Prévia", nota=8, comentario="Bom"))
        await session.commit()

    # Ainda serve do cache: não reflete a escrita direta no banco.
    assert await first_listed_title() == "Original"
    assert (await client.get(detail_url)).json()["titulo"] == "Original"

    response = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={"nome": "Visitante", "nota": 9, "comentario": "Muito bom"},
    )
    assert response.status_code == 201

    # create_review invalidou o cache: as próximas leituras refletem o banco atual.
    assert await first_listed_title() == "Mudou no banco"
    assert (await client.get(detail_url)).json()["titulo"] == "Mudou no banco"


async def test_list_movies_cache_key_varies_by_filters(
    client, session_factory: async_sessionmaker
) -> None:
    async with session_factory() as session:
        genre_a = DimGenre(nome_genero="Drama Cache Teste")
        genre_b = DimGenre(nome_genero="Comédia Cache Teste")
        session.add_all([genre_a, genre_b])
        await session.flush()
        session.add_all(
            [
                DimMovie(id_filme="cache-a", titulo="Filme A", genres=[genre_a]),
                DimMovie(id_filme="cache-b", titulo="Filme B", genres=[genre_b]),
            ]
        )
        await session.commit()
        genre_a_id, genre_b_id = genre_a.sk_genre_id, genre_b.sk_genre_id

    response_a = await client.get("/api/v1/movies", params={"genre_ids": [genre_a_id]})
    response_b = await client.get("/api/v1/movies", params={"genre_ids": [genre_b_id]})

    assert {item["titulo"] for item in response_a.json()["items"]} == {"Filme A"}
    assert {item["titulo"] for item in response_b.json()["items"]} == {"Filme B"}


async def test_dashboard_cache_invalidates_on_new_review(client, session_factory) -> None:
    async with session_factory() as session:
        movie = DimMovie(id_filme="cache-dash", titulo="Filme Dashboard")
        session.add(movie)
        await session.commit()
        movie_id = movie.sk_movie_id

    before = (await client.get("/api/v1/dashboard")).json()
    assert before["kpis"]["total_reviews"] == 0

    response = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={"nome": "Visitante", "nota": 7, "comentario": "Ok"},
    )
    assert response.status_code == 201

    after = (await client.get("/api/v1/dashboard")).json()
    assert after["kpis"]["total_reviews"] == 1
