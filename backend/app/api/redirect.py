"""Redirect endpoint for short URLs."""

import hashlib

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.analytics_service import record_click
from app.services.url_service import get_url_by_code, increment_clicks, is_url_expired

# Create limiter instance for this router
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(tags=["Redirect"])


def hash_ip(ip: str) -> str:
    """Hash an IP address for privacy."""
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


@router.get(
    "/{short_code}",
    response_class=RedirectResponse,
    status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    summary="Redirect to original URL",
    responses={
        307: {"description": "Redirect to original URL"},
        404: {"description": "Short code not found"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("300/minute")
async def redirect_to_url(
    short_code: str,
    request: Request,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """
    Redirect to the original URL for a given short code.
    
    This endpoint handles the main redirect functionality:
    1. Looks up the short code in the database
    2. If found, increments the click count
    3. Returns a 307 redirect to the original URL
    4. Returns 404 if the short code doesn't exist
    
    Args:
        short_code: The short code or custom alias to redirect
        db: Database session (injected)
        
    Returns:
        RedirectResponse to the original URL
        
    Raises:
        HTTPException: 404 if the short code is not found
    """
    url = get_url_by_code(db, short_code)
    
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Short URL '{short_code}' not found",
        )
    
    # Check if URL has expired
    if is_url_expired(url):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This link has expired",
        )
    
    # Increment click count
    increment_clicks(db, url)
    
    # Record click event for analytics
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")  # Note: HTTP header is "referer" (misspelled)
    client_ip = request.client.host if request.client else None
    ip_hash = hash_ip(client_ip) if client_ip else None
    
    record_click(
        db=db,
        url_id=url.id,
        user_agent=user_agent,
        referrer=referrer,
        ip_hash=ip_hash,
    )
    
    return RedirectResponse(
        url=url.original_url,
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )
