import httpx

from app.main import app


async def test_list_genres_returns_sorted_names() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/genres")

    assert response.status_code == 200
    genres = response.json()
    assert len(genres) > 0
    names = [genre["nome_genero"] for genre in genres]
    assert names == sorted(names)
    assert {"sk_genre_id", "nome_genero"} <= set(genres[0].keys())
