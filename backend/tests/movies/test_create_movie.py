from app.movies.models import DimGenre


async def test_create_movie_persists_full_cast_and_crew(client, session_factory) -> None:
    async with session_factory() as session:
        genre = DimGenre(nome_genero="Drama Teste Criação")
        session.add(genre)
        await session.commit()
        genre_id = genre.sk_genre_id

    response = await client.post(
        "/api/v1/movies",
        json={
            "titulo": "Filme de Teste Automatizado",
            "ano_lancamento": 2026,
            "genre_ids": [genre_id],
            "diretores": ["Diretora de Teste"],
            "atores": ["Atriz Um", "Ator Dois"],
            "roteiristas": ["Roteirista Teste"],
            "produtoras": ["Produtora Teste"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["titulo"] == "Filme de Teste Automatizado"
    assert body["genres"] == [{"sk_genre_id": genre_id, "nome_genero": "Drama Teste Criação"}]
    assert body["reviews"] == []
    assert body["nota_media"] is None
    assert body["qtd_avaliacoes"] == 0
    assert [c["nome_produtora"] for c in body["companies"]] == ["Produtora Teste"]

    people_by_role: dict[str, list[str]] = {"Diretor": [], "Ator": [], "Roteirista": []}
    for person in body["people"]:
        people_by_role[person["tipo_pessoa"]].append(person["nome_pessoa"])
    assert people_by_role["Diretor"] == ["Diretora de Teste"]
    assert set(people_by_role["Ator"]) == {"Atriz Um", "Ator Dois"}
    assert people_by_role["Roteirista"] == ["Roteirista Teste"]


async def test_create_movie_reuses_existing_person_case_insensitively(client) -> None:
    first = await client.post(
        "/api/v1/movies", json={"titulo": "Filme A", "diretores": ["Steven Spielberg"]}
    )
    second = await client.post(
        "/api/v1/movies", json={"titulo": "Filme B", "diretores": ["steven spielberg"]}
    )

    director_a = next(p for p in first.json()["people"] if p["tipo_pessoa"] == "Diretor")
    director_b = next(p for p in second.json()["people"] if p["tipo_pessoa"] == "Diretor")
    assert director_a["sk_person_id"] == director_b["sk_person_id"]
    assert director_a["nome_pessoa"] == "Steven Spielberg"


async def test_create_movie_rejects_duplicate_name_case_insensitive(client) -> None:
    response = await client.post(
        "/api/v1/movies",
        json={"titulo": "Filme Inválido", "atores": ["Tom Hanks", "tom hanks"]},
    )

    assert response.status_code == 422


async def test_create_movie_rejects_unknown_genre(client) -> None:
    response = await client.post(
        "/api/v1/movies",
        json={"titulo": "Filme Inválido", "genre_ids": ["id-que-nao-existe"]},
    )

    assert response.status_code == 400


async def test_create_movie_rejects_blank_title(client) -> None:
    response = await client.post("/api/v1/movies", json={"titulo": ""})

    assert response.status_code == 422
