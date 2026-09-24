import httpx

from app.main import app


async def test_create_movie_persists_genre_and_director() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        genres = (await client.get("/api/v1/genres")).json()
        genre = genres[0]

        response = await client.post(
            "/api/v1/movies",
            json={
                "titulo": "Filme de Teste Automatizado",
                "ano_lancamento": 2026,
                "genre_ids": [genre["sk_genre_id"]],
                "diretor": "Diretora de Teste Automatizado",
            },
        )

    assert response.status_code == 201
    body = response.json()
    assert body["titulo"] == "Filme de Teste Automatizado"
    assert body["genres"] == [genre]
    assert body["people"][0]["nome_pessoa"] == "Diretora de Teste Automatizado"
    assert body["people"][0]["tipo_pessoa"] == "Diretor"
    assert body["reviews"] == []
    assert body["nota_media"] is None
    assert body["qtd_avaliacoes"] == 0


async def test_create_movie_rejects_unknown_genre() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/movies",
            json={"titulo": "Filme Inválido", "genre_ids": ["id-que-nao-existe"]},
        )

    assert response.status_code == 400


async def test_create_movie_rejects_blank_title() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/movies", json={"titulo": ""})

    assert response.status_code == 422
