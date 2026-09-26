import httpx

from app.main import app


async def test_get_dashboard_returns_all_sections() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard")

    assert response.status_code == 200
    body = response.json()
    expected_keys = {
        "kpis",
        "rating_distribution",
        "avg_rating_by_genre",
        "movies_by_year",
        "top_rated_movies",
        "most_reviewed_movies",
        "top_movies_by_revenue",
        "financials_by_decade",
    }
    assert expected_keys <= set(body.keys())


async def test_kpis_total_movies_matches_catalog_total() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        dashboard = await client.get("/api/v1/dashboard")
        catalog = await client.get("/api/v1/movies", params={"page": 1, "page_size": 1})

    assert dashboard.json()["kpis"]["total_movies"] == catalog.json()["total"]


async def test_rating_distribution_has_ten_buckets_summing_to_total_reviews() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard")

    body = response.json()
    buckets = body["rating_distribution"]
    assert [bucket["faixa_inicio"] for bucket in buckets] == list(range(10))
    assert sum(bucket["qtd"] for bucket in buckets) == body["kpis"]["total_reviews"]


async def test_avg_rating_by_genre_has_all_genres() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        dashboard = await client.get("/api/v1/dashboard")
        genres = await client.get("/api/v1/genres")

    assert len(dashboard.json()["avg_rating_by_genre"]) == len(genres.json())


async def test_top_rated_movies_respects_review_threshold() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard")

    top_rated = response.json()["top_rated_movies"]
    assert len(top_rated) > 0
    assert all(movie["qtd_avaliacoes"] >= 5 for movie in top_rated)
    ratings = [movie["nota_media"] for movie in top_rated]
    assert ratings == sorted(ratings, reverse=True)


async def test_movies_by_year_has_no_gaps_and_matches_catalog_total() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard")

    years_data = response.json()["movies_by_year"]
    assert len(years_data) > 0
    years = [item["ano"] for item in years_data]
    assert years == list(range(years[0], years[-1] + 1))
    # A soma cobre só filmes com ano_lancamento preenchido, por isso é <= ao total do catálogo
    # (alguns filmes têm ano_lancamento nulo e não entram em nenhum bucket).
    total_movies = response.json()["kpis"]["total_movies"]
    assert 0 < sum(item["qtd"] for item in years_data) <= total_movies


async def test_financials_by_decade_is_null_safe() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard")

    assert response.status_code == 200
    decades = response.json()["financials_by_decade"]
    assert len(decades) > 0
    assert all(decade["decada"] % 10 == 0 for decade in decades)
