"""Analytics API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.analytics import URLAnalytics
from app.services.analytics_service import get_url_analytics

# Create limiter instance for this router
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/urls", tags=["Analytics"])


@router.get(
    "/{short_code}/analytics",
    response_model=URLAnalytics,
    summary="Get URL analytics",
    responses={
        200: {"description": "Analytics data for the URL"},
        404: {"description": "URL not found"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("60/minute")
async def get_analytics(
    request: Request,
    short_code: str,
    db: Session = Depends(get_db),
) -> URLAnalytics:
    """
    Get analytics data for a shortened URL.

    This endpoint returns:
    - Total click count
    - Clicks aggregated by day
    - Top referrers
    - Clicks by hour of day

    Args:
        short_code: The short code or custom alias of the URL
        db: Database session (injected)

    Returns:
        URLAnalytics with aggregated click data

    Raises:
        HTTPException: 404 if the short code is not found
    """
    analytics = get_url_analytics(db, short_code)

    if analytics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"URL with short code '{short_code}' not found",
        )

    return analytics
