import httpx

from app.main import app


async def _create_movie(client: httpx.AsyncClient, titulo: str) -> str:
    response = await client.post("/api/v1/movies", json={"titulo": titulo})
    return response.json()["sk_movie_id"]


async def test_create_review_updates_live_average() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        movie_id = await _create_movie(client, "Filme Para Avaliação Automatizada")

        before = await client.get(f"/api/v1/movies/{movie_id}")
        assert before.json()["nota_media"] is None
        assert before.json()["qtd_avaliacoes"] == 0

        first = await client.post(
            f"/api/v1/movies/{movie_id}/reviews",
            json={"nome": "Avaliador 1", "nota": 8.0, "comentario": "Muito bom"},
        )
        second = await client.post(
            f"/api/v1/movies/{movie_id}/reviews",
            json={"nome": "Avaliador 2", "nota": 4.0, "comentario": "Mediano"},
        )
        after = await client.get(f"/api/v1/movies/{movie_id}")

    assert first.status_code == second.status_code == 201
    assert first.json()["created_at"] is not None
    body = after.json()
    assert body["qtd_avaliacoes"] == 2
    assert body["nota_media"] == 6.0
    assert len(body["reviews"]) == 2


async def test_create_review_returns_404_for_unknown_movie() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/movies/id-que-nao-existe/reviews",
            json={"nome": "X", "nota": 5, "comentario": "Y"},
        )

    assert response.status_code == 404


async def test_create_review_rejects_rating_outside_0_to_10() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        movie_id = await _create_movie(client, "Filme Para Testar Validação de Nota")

        too_high = await client.post(
            f"/api/v1/movies/{movie_id}/reviews",
            json={"nome": "X", "nota": 11, "comentario": "Y"},
        )
        too_low = await client.post(
            f"/api/v1/movies/{movie_id}/reviews",
            json={"nome": "X", "nota": -1, "comentario": "Y"},
        )

    assert too_high.status_code == 422
    assert too_low.status_code == 422
