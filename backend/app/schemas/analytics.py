"""Pydantic schemas for analytics data."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClickEvent(BaseModel):
    """Schema for a single click event."""

    id: int
    url_id: int
    clicked_at: datetime
    user_agent: str | None = None
    referrer: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ClicksByDay(BaseModel):
    """Schema for clicks aggregated by day."""

    date: str
    count: int


class TopReferrer(BaseModel):
    """Schema for referrer with click count."""

    referrer: str
    count: int


class ClicksByHour(BaseModel):
    """Schema for clicks aggregated by hour of day."""

    hour: int
    count: int


class URLAnalytics(BaseModel):
    """Schema for complete URL analytics response."""

    total_clicks: int
    clicks_by_day: list[ClicksByDay]
    top_referrers: list[TopReferrer]
    clicks_by_hour: list[ClicksByHour]
