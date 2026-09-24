# Dados de seed

Esta pasta recebe os CSVs usados por `backend/scripts/seed.py` para popular o banco
SQLite local. Os arquivos em `csv/` **não são versionados** (ver `backend/.gitignore`) —
o maior deles (`bridge_movie_person.csv`) tem ~93MB / 745 mil linhas, acima do que faz
sentido commitar no Git.

## Origem

Os CSVs foram fornecidos junto com a atividade RocketLab 2026.2, em dois pacotes:

- **bases-1** (`bases_atv_dev1/`): `dim_companies.csv`, `dim_genres.csv`, `dim_movies.csv`,
  `dim_people.csv`, `dim_reviews.csv`
- **bases-2** (`bases_atv_dev_2/`): `bridge_movie_company.csv`, `bridge_movie_genre.csv`,
  `bridge_movie_person.csv`, `fact_movies_performance.csv`, `movies_reviews.csv`

## Como preparar

Copie os 10 arquivos `.csv` (dos dois pacotes) para `backend/data/seed/csv/`, mantendo os
nomes originais, antes de rodar `python -m scripts.seed`.
