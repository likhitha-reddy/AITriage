from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings


def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return f"postgresql://{database_url[len('postgres://'):]}"
    return database_url


settings = get_settings()
database_url = normalize_database_url(settings.database_url)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(
    database_url,
    future=True,
    pool_pre_ping=True,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
