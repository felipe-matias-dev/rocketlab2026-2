"""Fixtures compartilhadas: banco SQLite efêmero (migrado via Alembic, isolado do banco de
dev) e um client HTTP que usa esse banco via override de `get_db`.

Os testes que já existiam antes deste arquivo criam seu próprio `httpx.AsyncClient` e batem
direto no banco real de dev (`backend/rocketlab.db`) — isso continua funcionando como antes.
Os testes que precisam de isolamento (ex.: testes de cache, que dependem de estado
determinístico) devem usar os fixtures `client`/`session_factory` daqui.
"""

import asyncio
import os
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.session import enable_sqlite_foreign_keys, get_db
from app.main import app
from app.movies.cache import movie_cache

BACKEND_DIR = Path(__file__).resolve().parent.parent


def _upgrade_schema() -> None:
    """Roda `alembic upgrade head` de forma síncrona contra a `DATABASE_URL` atual.

    O `env.py` das migrações sempre lê `get_settings().database_url` (ver
    `migrations/env.py`) — ele ignora qualquer `sqlalchemy.url` passado aqui via
    `Config.set_main_option`. Por isso quem chama esta função precisa garantir que a env
    var `DATABASE_URL` e o cache de `get_settings` já apontam para o banco de teste antes
    de chamar `command.upgrade`.
    """

    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    command.upgrade(cfg, "head")


@pytest.fixture
async def session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    """Banco SQLite efêmero, com o schema real aplicado via Alembic, isolado do banco de
    dev. Cada teste recebe um arquivo novo, descartado no teardown."""

    original_database_url = os.environ.get("DATABASE_URL")
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = Path(tmp_dir) / "test.db"
        os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path.as_posix()}"
        get_settings.cache_clear()
        try:
            await asyncio.to_thread(_upgrade_schema)

            test_engine = create_async_engine(get_settings().database_url)
            enable_sqlite_foreign_keys(test_engine)
            test_session_factory = async_sessionmaker(
                bind=test_engine, expire_on_commit=False, autoflush=False
            )
            try:
                yield test_session_factory
            finally:
                await test_engine.dispose()
        finally:
            if original_database_url is None:
                os.environ.pop("DATABASE_URL", None)
            else:
                os.environ["DATABASE_URL"] = original_database_url
            get_settings.cache_clear()


@pytest.fixture
async def client(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncClient]:
    """Cliente HTTP contra `app`, com `get_db` sobrescrito para usar o banco de teste
    isolado, e o cache de respostas resetado antes/depois para não vazar entre testes."""

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    movie_cache.invalidate()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
        movie_cache.invalidate()
