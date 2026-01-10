"""Click event model for tracking URL analytics."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class Click(Base):
    """SQLAlchemy model for click events."""

    __tablename__ = "clicks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    url_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("urls.id", ondelete="CASCADE"), nullable=False, index=True
    )
    clicked_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Relationship to URL model
    url: Mapped["URL"] = relationship("URL", back_populates="clicks")

    def __repr__(self) -> str:
        return f"<Click(id={self.id}, url_id={self.url_id}, clicked_at='{self.clicked_at}')>"
