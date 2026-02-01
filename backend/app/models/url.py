from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.click import Click


class URL(Base):
    """SQLAlchemy model for shortened URLs."""

    __tablename__ = "urls"
    
    # Composite indexes for common query patterns
    __table_args__ = (
        Index("ix_urls_is_active_created_at", "is_active", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    short_code: Mapped[str] = mapped_column(
        String(10), unique=True, index=True, nullable=False
    )
    original_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    custom_alias: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    click_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship to Click events
    clicks: Mapped[list["Click"]] = relationship(
        "Click", back_populates="url", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<URL(id={self.id}, short_code='{self.short_code}')>"
