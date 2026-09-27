"""Cobre DELETE /movies/{id}/reviews/{review_id}: resumo ao vivo recalculado, média
some quando a última avaliação é removida, e casos de review/filme inexistente.

As avaliações são criadas via POST (não inseridas direto no banco): é o próprio
`create_review` que grava o resumo em `dim_reviews`, então criar por fora deixaria
esse resumo inconsistente antes mesmo do teste da exclusão começar.
"""


async def _create_movie(client, titulo: str) -> str:
    response = await client.post("/api/v1/movies", json={"titulo": titulo})
    return response.json()["sk_movie_id"]


async def _create_review(client, movie_id: str, *, nome: str, nota: float) -> str:
    response = await client.post(
        f"/api/v1/movies/{movie_id}/reviews",
        json={"nome": nome, "nota": nota, "comentario": "Comentário de teste"},
    )
    return response.json()["sk_movie_review_id"]


async def test_delete_review_recalculates_live_average(client) -> None:
    movie_id = await _create_movie(client, "Filme Para Excluir Avaliação")
    await _create_review(client, movie_id, nome="A", nota=8)
    drop_id = await _create_review(client, movie_id, nome="B", nota=2)

    before = await client.get(f"/api/v1/movies/{movie_id}")
    assert before.json()["qtd_avaliacoes"] == 2
    assert before.json()["nota_media"] == 5.0

    response = await client.delete(f"/api/v1/movies/{movie_id}/reviews/{drop_id}")
    assert response.status_code == 204

    after = await client.get(f"/api/v1/movies/{movie_id}")
    body = after.json()
    assert body["qtd_avaliacoes"] == 1
    assert body["nota_media"] == 8.0
    assert [review["nome"] for review in body["reviews"]] == ["A"]


async def test_delete_last_review_clears_average(client) -> None:
    movie_id = await _create_movie(client, "Filme Com Uma Só Avaliação")
    review_id = await _create_review(client, movie_id, nome="A", nota=6)

    response = await client.delete(f"/api/v1/movies/{movie_id}/reviews/{review_id}")
    assert response.status_code == 204

    after = await client.get(f"/api/v1/movies/{movie_id}")
    body = after.json()
    assert body["qtd_avaliacoes"] == 0
    assert body["nota_media"] is None
    assert body["reviews"] == []


async def test_delete_review_returns_404_for_unknown_review(client) -> None:
    movie_id = await _create_movie(client, "Filme Sem A Avaliação Pedida")

    response = await client.delete(f"/api/v1/movies/{movie_id}/reviews/id-que-nao-existe")
    assert response.status_code == 404


async def test_delete_review_returns_404_when_review_belongs_to_another_movie(client) -> None:
    movie_a_id = await _create_movie(client, "Filme A")
    movie_b_id = await _create_movie(client, "Filme B")
    review_id = await _create_review(client, movie_a_id, nome="A", nota=5)

    response = await client.delete(f"/api/v1/movies/{movie_b_id}/reviews/{review_id}")
    assert response.status_code == 404

    # A avaliação continua existindo no filme A: a tentativa em B não a excluiu.
    movie_a = await client.get(f"/api/v1/movies/{movie_a_id}")
    assert movie_a.json()["qtd_avaliacoes"] == 1
