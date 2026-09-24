# RocketLab 2026.2 — Sistema de Avaliação de Filmes

Painel administrativo para cadastro, catálogo e avaliação de filmes, desenvolvido para a
atividade DEV do RocketLab 2026.2 (Visagio). O usuário é um Administrador único: cadastra e
gerencia o catálogo, navega numa listagem paginada com busca, vê a ficha completa de cada
filme com o histórico de avaliações, e adiciona novas notas/resenhas.

**Stack:** Vite + React + TypeScript + Tailwind CSS (frontend), FastAPI assíncrono (backend),
SQLite via SQLAlchemy 2.0 + Alembic.

## Estrutura

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/  # routers: movies, reviews, genres
│   │   ├── core/               # configurações e logging
│   │   ├── db/                 # Base ORM, engine e sessão async
│   │   └── movies/              # models SQLAlchemy, schemas Pydantic, regras de negócio
│   ├── data/seed/               # onde colocar os CSVs (gitignored, ver data/seed/README.md)
│   ├── migrations/              # Alembic
│   ├── scripts/seed.py          # carga dos CSVs no banco, em lotes
│   └── tests/
└── frontend/
    └── src/
        ├── api/         # cliente HTTP e chamadas tipadas
        ├── components/  # MovieCard, MovieForm, ReviewForm, Pagination, SearchBar...
        ├── pages/        # Catálogo, Detalhe, Cadastrar, Editar
        └── types/        # espelham os schemas Pydantic do backend
```

## Pré-requisitos

- Python 3.11+
- Node.js 18+
- Os 10 arquivos `.csv` fornecidos na atividade (dimensões, bridges, fato e avaliações)

## 1. Preparar os dados

Copie os 10 CSVs fornecidos na atividade para `backend/data/seed/csv/` (mantendo os nomes
originais). Detalhes de origem em [`backend/data/seed/README.md`](backend/data/seed/README.md).
Eles não são versionados no Git — o maior deles sozinho tem ~93MB.

## 2. Backend

```bash
cd backend
python -m venv .venv

# ative o ambiente virtual:
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\Activate.ps1       # Windows PowerShell

pip install -e ".[dev]"
cp .env.example .env             # Windows: copy .env.example .env

alembic upgrade head             # cria o schema (nunca use create_all)
python -m scripts.seed           # popula o banco a partir dos CSVs (leva alguns minutos)

uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`; documentação automática em
`http://localhost:8000/docs`. `GET /health` confirma que subiu corretamente.

## 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env             # Windows: copy .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173` e já está configurada para falar com o backend em
`http://localhost:8000/api/v1` (`VITE_API_BASE_URL` no `.env`; CORS já liberado no backend para
essa origem).

## Rodando os testes (backend)

```bash
cd backend
pytest
```

Os testes rodam contra o mesmo banco SQLite local configurado em `.env` (não há um banco de
teste isolado nesta fase) — rode `alembic upgrade head` e `python -m scripts.seed` antes da
primeira execução.

## Modelo de dados

O catálogo é modelado como um esquema estrela: `dim_movies`, `dim_genres`, `dim_companies`,
`dim_people` (ator/diretor/roteirista), tabelas de associação N:N (`bridge_movie_*`),
`fact_movies_performance` (métricas de bilheteria/popularidade importadas do CSV, não expostas
pela API) e `movie_reviews` (avaliações individuais, nota de 0 a 10). A média de avaliações
exibida na API é sempre calculada ao vivo a partir de `movie_reviews`, nunca de um snapshot
estático. Mais decisões de produto e do sistema visual em [`PRODUCT.md`](PRODUCT.md) e
[`DESIGN.md`](DESIGN.md).

## Escopo

Implementados os 7 requisitos obrigatórios do enunciado: cadastro de filmes, catálogo
paginado, busca por título, detalhes com histórico de avaliações, remoção/atualização de
filmes, nova avaliação (nota 0–10 + resenha) e média geral por filme. Testes automatizados
adicionais, autenticação, filtros avançados, storybook e caching ficam como possíveis
próximos passos, fora do escopo desta entrega.

---

Copyright © 2026 Visagio. Todos os direitos reservados.
