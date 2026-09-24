import httpx

from app.main import app

RINGS_ID = "b5c312c4d8cee94972412b9ea785976f9dbb2c26dd11480d9f2b9b4691df1571"


async def test_update_movie_preserves_cast_when_only_director_changes() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        before = (await client.get(f"/api/v1/movies/{RINGS_ID}")).json()
        non_director_before = sorted(
            (p["sk_person_id"], p["tipo_pessoa"])
            for p in before["people"]
            if p["tipo_pessoa"] != "Diretor"
        )
        assert non_director_before, "fixture deveria ter elenco/roteiristas importados do CSV"

        response = await client.put(
            f"/api/v1/movies/{RINGS_ID}",
            json={
                "titulo": before["titulo"],
                "data_lancamento": before["data_lancamento"],
                "ano_lancamento": before["ano_lancamento"],
                "duracao_minutos": before["duracao_minutos"],
                "status_filme": before["status_filme"],
                "sinopse": before["sinopse"],
                "url_poster": before["url_poster"],
                "url_backdrop": before["url_backdrop"],
                "genre_ids": [g["sk_genre_id"] for g in before["genres"]],
                "diretor": "Diretor Substituto de Teste",
            },
        )

    assert response.status_code == 200
    body = response.json()

    # PUT é substituição completa (sem semântica de PATCH): um campo omitido
    # vira None. Confirma que enviar o corpo inteiro preserva os escalares.
    assert body["ano_lancamento"] == before["ano_lancamento"]
    assert body["data_lancamento"] == before["data_lancamento"]
    assert body["duracao_minutos"] == before["duracao_minutos"]
    assert body["status_filme"] == before["status_filme"]

    non_director_after = sorted(
        (p["sk_person_id"], p["tipo_pessoa"])
        for p in body["people"]
        if p["tipo_pessoa"] != "Diretor"
    )
    assert non_director_after == non_director_before

    directors_after = [p["nome_pessoa"] for p in body["people"] if p["tipo_pessoa"] == "Diretor"]
    assert directors_after == ["Diretor Substituto de Teste"]


async def test_update_movie_returns_404_for_unknown_id() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.put("/api/v1/movies/id-que-nao-existe", json={"titulo": "X"})

    assert response.status_code == 404


async def test_update_movie_rejects_unknown_genre() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.put(
            f"/api/v1/movies/{RINGS_ID}",
            json={"titulo": "X", "genre_ids": ["id-que-nao-existe"]},
        )

    assert response.status_code == 400
