"""Analytics service for click tracking and aggregation."""

from collections import defaultdict
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.click import Click
from app.models.url import URL
from app.schemas.analytics import (
    ClicksByDay,
    ClicksByHour,
    TopReferrer,
    URLAnalytics,
)


def record_click(
    db: Session,
    url_id: int,
    user_agent: str | None = None,
    referrer: str | None = None,
    ip_hash: str | None = None,
) -> Click:
    """
    Record a click event for a URL.

    Args:
        db: Database session
        url_id: ID of the URL that was clicked
        user_agent: Browser user agent string
        referrer: Referring URL
        ip_hash: Hashed IP address for privacy

    Returns:
        The created Click object
    """
    click = Click(
        url_id=url_id,
        user_agent=user_agent,
        referrer=referrer,
        ip_hash=ip_hash,
        clicked_at=datetime.utcnow(),
    )
    db.add(click)
    db.commit()
    db.refresh(click)
    return click


def get_url_analytics(db: Session, short_code: str) -> URLAnalytics | None:
    """
    Get analytics data for a URL by its short code.

    Args:
        db: Database session
        short_code: The short code or custom alias of the URL

    Returns:
        URLAnalytics object with aggregated data, or None if URL not found
    """
    # Find the URL by short code or custom alias
    url = db.query(URL).filter(
        (URL.short_code == short_code) | (URL.custom_alias == short_code)
    ).first()

    if not url:
        return None

    # Get all clicks for this URL
    clicks = db.query(Click).filter(Click.url_id == url.id).all()

    total_clicks = len(clicks)

    # Aggregate clicks by day
    clicks_by_day_dict: dict[str, int] = defaultdict(int)
    for click in clicks:
        date_str = click.clicked_at.strftime("%Y-%m-%d")
        clicks_by_day_dict[date_str] += 1

    clicks_by_day = [
        ClicksByDay(date=date, count=count)
        for date, count in sorted(clicks_by_day_dict.items())
    ]

    # Aggregate by referrer
    referrer_counts: dict[str, int] = defaultdict(int)
    for click in clicks:
        referrer = click.referrer or "Direct"
        # Clean up referrer to just domain if it's a URL
        if referrer.startswith("http"):
            try:
                from urllib.parse import urlparse
                parsed = urlparse(referrer)
                referrer = parsed.netloc or "Direct"
            except Exception:
                pass
        referrer_counts[referrer] += 1

    top_referrers = [
        TopReferrer(referrer=referrer, count=count)
        for referrer, count in sorted(
            referrer_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]  # Top 10 referrers
    ]

    # Aggregate by hour of day
    clicks_by_hour_dict: dict[int, int] = defaultdict(int)
    for click in clicks:
        hour = click.clicked_at.hour
        clicks_by_hour_dict[hour] += 1

    clicks_by_hour = [
        ClicksByHour(hour=hour, count=clicks_by_hour_dict.get(hour, 0))
        for hour in range(24)  # All 24 hours
    ]

    return URLAnalytics(
        total_clicks=total_clicks,
        clicks_by_day=clicks_by_day,
        top_referrers=top_referrers,
        clicks_by_hour=clicks_by_hour,
    )
