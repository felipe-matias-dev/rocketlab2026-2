import httpx

from app.main import app


async def test_list_movies_returns_paginated_envelope() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/movies", params={"page": 1, "page_size": 5})

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 1
    assert body["page_size"] == 5
    assert len(body["items"]) == 5
    assert body["total"] >= len(body["items"])
    expected_keys = {
        "sk_movie_id",
        "titulo",
        "ano_lancamento",
        "url_poster",
        "nota_media",
        "qtd_avaliacoes",
    }
    assert expected_keys <= set(body["items"][0].keys())


async def test_list_movies_filters_by_title_case_insensitive() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        upper = await client.get("/api/v1/movies", params={"q": "Rings", "page_size": 5})
        lower = await client.get("/api/v1/movies", params={"q": "rings", "page_size": 5})
        empty = await client.get(
            "/api/v1/movies", params={"q": "zzzznonexistentxyz", "page_size": 5}
        )

    assert upper.status_code == lower.status_code == empty.status_code == 200
    assert upper.json()["total"] == lower.json()["total"] > 0
    assert empty.json()["total"] == 0
    assert empty.json()["items"] == []
    for movie in upper.json()["items"]:
        assert "rings" in movie["titulo"].lower()
