async def _create_movie(client, **overrides):
    payload = {
        "titulo": "Filme Original",
        "ano_lancamento": 2020,
        "genre_ids": [],
        "diretores": ["Diretor Original"],
        "atores": ["Atriz Original"],
        "roteiristas": ["Roteirista Original"],
        "produtoras": ["Produtora Original"],
    }
    payload.update(overrides)
    response = await client.post("/api/v1/movies", json=payload)
    assert response.status_code == 201
    return response.json()


async def test_update_movie_replaces_full_cast(client) -> None:
    before = await _create_movie(client)

    response = await client.put(
        f"/api/v1/movies/{before['sk_movie_id']}",
        json={
            "titulo": before["titulo"],
            "ano_lancamento": before["ano_lancamento"],
            "genre_ids": [],
            "diretores": ["Diretor Substituto de Teste"],
            "atores": ["Novo Ator"],
            "roteiristas": [],
            "produtoras": [],
        },
    )

    assert response.status_code == 200
    body = response.json()

    people_by_role: dict[str, list[str]] = {"Diretor": [], "Ator": [], "Roteirista": []}
    for person in body["people"]:
        people_by_role[person["tipo_pessoa"]].append(person["nome_pessoa"])
    assert people_by_role["Diretor"] == ["Diretor Substituto de Teste"]
    assert people_by_role["Ator"] == ["Novo Ator"]
    assert people_by_role["Roteirista"] == []
    assert body["companies"] == []


async def test_update_movie_round_trip_from_detail_preserves_everything(client) -> None:
    """Reenviar o próprio GET detail como corpo do PUT (o que o frontend faz ao editar sem
    trocar nada) não deve perder elenco, produtoras ou gêneros."""

    before = await _create_movie(client)

    response = await client.put(
        f"/api/v1/movies/{before['sk_movie_id']}",
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
            "diretores": [
                p["nome_pessoa"] for p in before["people"] if p["tipo_pessoa"] == "Diretor"
            ],
            "atores": [p["nome_pessoa"] for p in before["people"] if p["tipo_pessoa"] == "Ator"],
            "roteiristas": [
                p["nome_pessoa"] for p in before["people"] if p["tipo_pessoa"] == "Roteirista"
            ],
            "produtoras": [c["nome_produtora"] for c in before["companies"]],
        },
    )

    assert response.status_code == 200
    after = response.json()
    assert sorted(after["people"], key=lambda p: p["nome_pessoa"]) == sorted(
        before["people"], key=lambda p: p["nome_pessoa"]
    )
    assert after["companies"] == before["companies"]
    assert after["genres"] == before["genres"]


async def test_update_movie_returns_404_for_unknown_id(client) -> None:
    response = await client.put("/api/v1/movies/id-que-nao-existe", json={"titulo": "X"})

    assert response.status_code == 404


async def test_update_movie_rejects_unknown_genre(client) -> None:
    before = await _create_movie(client)

    response = await client.put(
        f"/api/v1/movies/{before['sk_movie_id']}",
        json={"titulo": "X", "genre_ids": ["id-que-nao-existe"]},
    )

    assert response.status_code == 400
