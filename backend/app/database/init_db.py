from app.database.connection import Base, engine


def init_db() -> None:
    """
    Initialize the database by creating all tables.
    
    This function imports all models to ensure they are registered
    with the Base metadata before creating tables.
    """
    # Import all models to register them with Base
    from app.models import url  # noqa: F401
    from app.models import click  # noqa: F401
    
    Base.metadata.create_all(bind=engine)
