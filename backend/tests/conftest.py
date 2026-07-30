from collections.abc import Generator
import os

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg import sql
from sqlalchemy.engine import make_url


def ensure_database_exists() -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set before running tests")

    parsed_url = make_url(database_url)
    if not parsed_url.database:
        raise RuntimeError("DATABASE_URL must include a database name")

    target_database = parsed_url.database

    with psycopg.connect(
        host=parsed_url.host,
        port=parsed_url.port,
        user=parsed_url.username,
        password=parsed_url.password,
        dbname="postgres",
        autocommit=True,
    ) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (target_database,),
            )
            if cursor.fetchone() is None:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}")
                    .format(sql.Identifier(target_database))
                )


ensure_database_exists()

from app.db import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
