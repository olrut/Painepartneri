import os
import asyncio
import uuid
import pytest

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db import Base


@pytest.fixture(scope="session", autouse=True)
def set_env():
    os.environ.setdefault("SECRET_KEY", "test-secret-key")
    os.environ.setdefault("SEND_EMAILS", "false")
    os.environ.setdefault("TEST_FIXED_OTP", "1111")
    os.environ.setdefault("AUTO_CREATE_DB_SCHEMA", "false")
    # Optional redirect base to build links; not required for tests
    os.environ.setdefault("VERIFY_LINK_BASE", "http://testserver")
    yield


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_engine(event_loop):
    # File-based SQLite to keep schema across connections
    engine = create_async_engine("sqlite+aiosqlite:///./test.db", future=True)
    async def init_models():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    event_loop.run_until_complete(init_models())
    yield engine


@pytest.fixture(scope="session")
def async_session_maker(test_engine):
    return sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture()
def app_client(async_session_maker, monkeypatch):
    # Override get_async_session to use the test engine
    from app import db as app_db
    from app.app import app

    async def _get_test_session():
        async with async_session_maker() as session:
            yield session

    app.dependency_overrides[app_db.get_async_session] = _get_test_session

    with TestClient(app) as client:
        yield client
