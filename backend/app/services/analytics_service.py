"""Analytics service for click tracking and aggregation."""

from datetime import datetime, timedelta
from urllib.parse import urlparse

from sqlalchemy import case, func, select, text
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


def _extract_referrer_domain(referrer: str | None) -> str:
    """Extract domain from referrer URL or return 'Direct'."""
    if not referrer:
        return "Direct"
    if referrer.startswith("http"):
        try:
            parsed = urlparse(referrer)
            return parsed.netloc or "Direct"
        except Exception:
            pass
    return referrer


def get_url_analytics(db: Session, short_code: str) -> URLAnalytics | None:
    """
    Get analytics data for a URL by its short code using optimized SQL aggregations.

    Args:
        db: Database session
        short_code: The short code or custom alias of the URL

    Returns:
        URLAnalytics object with aggregated data, or None if URL not found
    """
    # Find the URL by short code or custom alias (only fetch id)
    url_query = select(URL.id, URL.click_count).where(
        ((URL.short_code == short_code) | (URL.custom_alias == short_code))
        & (URL.is_active == True)
    )
    url_result = db.execute(url_query).first()

    if not url_result:
        return None

    url_id, cached_click_count = url_result

    # Get total clicks using SQL COUNT (use cached value if available, verify with query)
    total_clicks_query = select(func.count(Click.id)).where(Click.url_id == url_id)
    total_clicks = db.execute(total_clicks_query).scalar() or 0

    # Aggregate clicks by day using SQL GROUP BY
    # Using SQLite's date() function for date extraction
    clicks_by_day_query = (
        select(
            func.date(Click.clicked_at).label("date"),
            func.count(Click.id).label("count"),
        )
        .where(Click.url_id == url_id)
        .group_by(func.date(Click.clicked_at))
        .order_by(func.date(Click.clicked_at))
    )
    clicks_by_day_results = db.execute(clicks_by_day_query).all()
    clicks_by_day = [
        ClicksByDay(date=str(row.date), count=row.count)
        for row in clicks_by_day_results
    ]

    # Aggregate by referrer using SQL GROUP BY
    # Get referrers and count them in database
    referrer_query = (
        select(
            Click.referrer,
            func.count(Click.id).label("count"),
        )
        .where(Click.url_id == url_id)
        .group_by(Click.referrer)
        .order_by(func.count(Click.id).desc())
        .limit(20)  # Get more than needed for domain extraction deduplication
    )
    referrer_results = db.execute(referrer_query).all()

    # Process referrers to extract domains (this needs Python processing)
    referrer_counts: dict[str, int] = {}
    for row in referrer_results:
        domain = _extract_referrer_domain(row.referrer)
        referrer_counts[domain] = referrer_counts.get(domain, 0) + row.count

    top_referrers = [
        TopReferrer(referrer=referrer, count=count)
        for referrer, count in sorted(
            referrer_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]
    ]

    # Aggregate by hour of day using SQL
    # Using SQLite's strftime for hour extraction
    clicks_by_hour_query = (
        select(
            func.cast(func.strftime("%H", Click.clicked_at), Integer).label("hour"),
            func.count(Click.id).label("count"),
        )
        .where(Click.url_id == url_id)
        .group_by(func.strftime("%H", Click.clicked_at))
    )
    
    # Import Integer for casting
    from sqlalchemy import Integer
    
    clicks_by_hour_results = db.execute(clicks_by_hour_query).all()
    hour_counts = {row.hour: row.count for row in clicks_by_hour_results}

    # Fill in all 24 hours
    clicks_by_hour = [
        ClicksByHour(hour=hour, count=hour_counts.get(hour, 0))
        for hour in range(24)
    ]

    return URLAnalytics(
        total_clicks=total_clicks,
        clicks_by_day=clicks_by_day,
        top_referrers=top_referrers,
        clicks_by_hour=clicks_by_hour,
    )


def get_url_analytics_for_date_range(
    db: Session,
    short_code: str,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> URLAnalytics | None:
    """
    Get analytics for a specific date range using indexed columns.

    Args:
        db: Database session
        short_code: The short code or custom alias of the URL
        start_date: Start of the date range (inclusive)
        end_date: End of the date range (inclusive)

    Returns:
        URLAnalytics object with aggregated data, or None if URL not found
    """
    # Find the URL
    url_query = select(URL.id).where(
        ((URL.short_code == short_code) | (URL.custom_alias == short_code))
        & (URL.is_active == True)
    )
    url_id = db.execute(url_query).scalar()

    if not url_id:
        return None

    # Build base filter conditions
    conditions = [Click.url_id == url_id]
    if start_date:
        conditions.append(Click.clicked_at >= start_date)
    if end_date:
        conditions.append(Click.clicked_at <= end_date)

    # Get total clicks for range
    total_query = select(func.count(Click.id)).where(*conditions)
    total_clicks = db.execute(total_query).scalar() or 0

    # Clicks by day for range
    clicks_by_day_query = (
        select(
            func.date(Click.clicked_at).label("date"),
            func.count(Click.id).label("count"),
        )
        .where(*conditions)
        .group_by(func.date(Click.clicked_at))
        .order_by(func.date(Click.clicked_at))
    )
    clicks_by_day = [
        ClicksByDay(date=str(row.date), count=row.count)
        for row in db.execute(clicks_by_day_query).all()
    ]

    # Top referrers for range
    referrer_query = (
        select(Click.referrer, func.count(Click.id).label("count"))
        .where(*conditions)
        .group_by(Click.referrer)
        .order_by(func.count(Click.id).desc())
        .limit(20)
    )
    referrer_results = db.execute(referrer_query).all()
    
    referrer_counts: dict[str, int] = {}
    for row in referrer_results:
        domain = _extract_referrer_domain(row.referrer)
        referrer_counts[domain] = referrer_counts.get(domain, 0) + row.count

    top_referrers = [
        TopReferrer(referrer=referrer, count=count)
        for referrer, count in sorted(
            referrer_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]
    ]

    # Import Integer for casting
    from sqlalchemy import Integer

    # Clicks by hour for range
    clicks_by_hour_query = (
        select(
            func.cast(func.strftime("%H", Click.clicked_at), Integer).label("hour"),
            func.count(Click.id).label("count"),
        )
        .where(*conditions)
        .group_by(func.strftime("%H", Click.clicked_at))
    )
    hour_counts = {
        row.hour: row.count for row in db.execute(clicks_by_hour_query).all()
    }
    clicks_by_hour = [
        ClicksByHour(hour=hour, count=hour_counts.get(hour, 0))
        for hour in range(24)
    ]

    return URLAnalytics(
        total_clicks=total_clicks,
        clicks_by_day=clicks_by_day,
        top_referrers=top_referrers,
        clicks_by_hour=clicks_by_hour,
    )


def get_global_stats(db: Session) -> dict:
    """
    Get global statistics across all URLs using efficient aggregations.

    Returns:
        Dictionary with global stats
    """
    # Total URLs count
    total_urls = db.execute(
        select(func.count(URL.id)).where(URL.is_active == True)
    ).scalar() or 0

    # Total clicks count
    total_clicks = db.execute(select(func.count(Click.id))).scalar() or 0

    # URLs created in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_urls = db.execute(
        select(func.count(URL.id)).where(
            (URL.is_active == True) & (URL.created_at >= yesterday)
        )
    ).scalar() or 0

    # Clicks in last 24 hours
    recent_clicks = db.execute(
        select(func.count(Click.id)).where(Click.clicked_at >= yesterday)
    ).scalar() or 0

    return {
        "total_urls": total_urls,
        "total_clicks": total_clicks,
        "urls_last_24h": recent_urls,
        "clicks_last_24h": recent_clicks,
    }
