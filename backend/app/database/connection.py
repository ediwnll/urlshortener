from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings


# Determine database type from URL
is_sqlite = settings.DATABASE_URL.startswith("sqlite")


def _create_engine():
    """Create database engine based on DATABASE_URL."""
    if is_sqlite:
        # SQLite-specific configuration
        return create_engine(
            settings.DATABASE_URL,
            connect_args={
                "check_same_thread": False,  # Needed for SQLite with FastAPI
                "timeout": 30,  # Increase lock timeout for concurrent access
            },
            poolclass=StaticPool,  # Use StaticPool for SQLite (single connection)
            pool_pre_ping=True,
            echo=False,
        )
    else:
        # PostgreSQL configuration
        return create_engine(
            settings.DATABASE_URL,
            pool_size=5,  # Number of connections to keep open
            max_overflow=10,  # Additional connections when pool is exhausted
            pool_pre_ping=True,  # Verify connection health before use
            echo=False,
        )


engine = _create_engine()


# Enable SQLite optimizations via PRAGMA statements (only for SQLite)
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Set SQLite PRAGMA settings for better performance."""
        cursor = dbapi_connection.cursor()
        # Enable Write-Ahead Logging for better concurrent read/write performance
        cursor.execute("PRAGMA journal_mode=WAL")
        # Set synchronous to NORMAL for better performance (still safe with WAL)
        cursor.execute("PRAGMA synchronous=NORMAL")
        # Enable foreign key enforcement
        cursor.execute("PRAGMA foreign_keys=ON")
        # Set a reasonable cache size (negative value = KB, positive = pages)
        cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
        # Use memory-mapped I/O for better read performance
        cursor.execute("PRAGMA mmap_size=268435456")  # 256MB
        # Optimize temp storage
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db() -> Generator[Session, Any, None]:
    """
    Dependency function that provides a database session.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def optimize_database() -> None:
    """
    Run database optimization commands.
    Call this periodically for maintenance.
    Only applicable for SQLite.
    """
    if is_sqlite:
        with engine.connect() as conn:
            conn.execute(text("PRAGMA optimize"))
            conn.commit()
