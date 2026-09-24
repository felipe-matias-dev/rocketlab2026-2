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
        "reviews",
        "nota_media",
        "qtd_avaliacoes",
    }
    assert expected_keys <= set(body.keys())
    assert body["qtd_avaliacoes"] == len(body["reviews"])


async def test_get_movie_detail_returns_404_for_unknown_id() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/movies/id-que-nao-existe")

    assert response.status_code == 404
