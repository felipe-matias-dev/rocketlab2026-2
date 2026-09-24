import httpx

from app.main import app


async def test_delete_movie_removes_it_and_is_idempotent_on_404() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        created = await client.post(
            "/api/v1/movies", json={"titulo": "Filme Descartável de Teste"}
        )
        movie_id = created.json()["sk_movie_id"]

        before_delete = await client.get(f"/api/v1/movies/{movie_id}")
        delete_response = await client.delete(f"/api/v1/movies/{movie_id}")
        after_delete = await client.get(f"/api/v1/movies/{movie_id}")
        delete_again = await client.delete(f"/api/v1/movies/{movie_id}")

    assert before_delete.status_code == 200
    assert delete_response.status_code == 204
    assert after_delete.status_code == 404
    assert delete_again.status_code == 404


async def test_delete_movie_returns_404_for_unknown_id() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.delete("/api/v1/movies/id-que-nao-existe")

    assert response.status_code == 404
