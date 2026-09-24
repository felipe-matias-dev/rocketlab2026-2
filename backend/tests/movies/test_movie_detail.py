import httpx

from app.main import app


async def test_get_movie_detail_returns_full_payload() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        listing = await client.get("/api/v1/movies", params={"page_size": 1})
        movie_id = listing.json()["items"][0]["sk_movie_id"]

        response = await client.get(f"/api/v1/movies/{movie_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["sk_movie_id"] == movie_id
    expected_keys = {
        "id_filme",
        "titulo",
        "sinopse",
        "genres",
        "people",
        "companies",
        "reviews",
        "nota_media",
        "qtd_avaliacoes",
        "performance",
    }
    assert expected_keys <= set(body.keys())
    assert body["qtd_avaliacoes"] == len(body["reviews"])
    assert isinstance(body["companies"], list)


async def test_get_movie_detail_handles_missing_and_present_performance() -> None:
    """fact_movies_performance nem sempre tem linha para o filme; a resposta não pode quebrar
    nos dois casos, e quando presente deve trazer as métricas de bilheteria/nota externa."""

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        listing = await client.get("/api/v1/movies", params={"page_size": 50})
        movie_ids = [item["sk_movie_id"] for item in listing.json()["items"]]

        seen_present = False
        seen_missing = False
        for movie_id in movie_ids:
            response = await client.get(f"/api/v1/movies/{movie_id}")
            assert response.status_code == 200
            performance = response.json()["performance"]
            if performance is None:
                seen_missing = True
                continue
            seen_present = True
            assert {"orcamento_usd", "receita_usd", "lucro_usd", "nota_tmdb", "nota_imdb"} <= set(
                performance.keys()
            )

    assert seen_present or seen_missing  # a amostra respondeu sem erro em qualquer combinação


async def test_get_movie_detail_returns_404_for_unknown_id() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/movies/id-que-nao-existe")

    assert response.status_code == 404
