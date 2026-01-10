"""URL shortening business logic service."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.url import URL
from app.services.shortcode import generate_short_code, is_valid_custom_alias


class URLServiceError(Exception):
    """Base exception for URL service errors."""
    pass


class AliasAlreadyExistsError(URLServiceError):
    """Raised when a custom alias already exists."""
    pass


class InvalidAliasError(URLServiceError):
    """Raised when a custom alias is invalid."""
    pass


def is_url_expired(url: URL) -> bool:
    """
    Check if a URL has expired.
    
    Args:
        url: The URL model instance to check
        
    Returns:
        True if the URL has expired, False otherwise
    """
    if url.expires_at is None:
        return False
    # Use timezone-aware comparison
    now = datetime.now(timezone.utc)
    expires_at = url.expires_at.replace(tzinfo=timezone.utc) if url.expires_at.tzinfo is None else url.expires_at
    return now > expires_at


def create_short_url(
    db: Session,
    original_url: str,
    custom_alias: str | None = None,
    expires_in_hours: int | None = None,
    max_retries: int = 5,
) -> URL:
    """
    Create a shortened URL.
    
    Args:
        db: Database session
        original_url: The original URL to shorten
        custom_alias: Optional custom alias for the short URL
        expires_in_hours: Optional number of hours until the URL expires
        max_retries: Maximum number of retries for generating unique short codes
        
    Returns:
        The created URL model instance
        
    Raises:
        InvalidAliasError: If the custom alias is invalid
        AliasAlreadyExistsError: If the custom alias already exists
        URLServiceError: If unable to generate a unique short code
    """
    short_code: str
    
    if custom_alias:
        # Validate custom alias
        if not is_valid_custom_alias(custom_alias):
            raise InvalidAliasError(
                "Custom alias must be 3-20 characters long and contain only "
                "alphanumeric characters, hyphens, and underscores"
            )
        
        # Check if custom alias already exists
        existing = get_url_by_code(db, custom_alias)
        if existing:
            raise AliasAlreadyExistsError(
                f"Custom alias '{custom_alias}' is already in use"
            )
        
        short_code = custom_alias
    else:
        # Generate a unique short code
        for _ in range(max_retries):
            short_code = generate_short_code()
            if not get_url_by_code(db, short_code):
                break
        else:
            raise URLServiceError(
                "Unable to generate a unique short code. Please try again."
            )
    
    # Calculate expiration time if specified
    expires_at = None
    if expires_in_hours is not None and expires_in_hours > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
    
    # Create the URL record
    url = URL(
        short_code=short_code,
        original_url=str(original_url),
        custom_alias=custom_alias,
        expires_at=expires_at,
    )
    
    db.add(url)
    db.commit()
    db.refresh(url)
    
    return url


def get_url_by_code(db: Session, code: str) -> URL | None:
    """
    Fetch a URL by its short code or custom alias.
    
    Args:
        db: Database session
        code: The short code or custom alias to look up
        
    Returns:
        The URL model if found, None otherwise
    """
    stmt = select(URL).where(
        (URL.short_code == code) & (URL.is_active == True)
    )
    return db.execute(stmt).scalar_one_or_none()


def increment_clicks(db: Session, url: URL) -> None:
    """
    Increment the click count for a URL.
    
    Args:
        db: Database session
        url: The URL model to update
    """
    url.click_count += 1
    db.commit()


def get_all_urls(
    db: Session,
    skip: int = 0,
    limit: int = 10,
) -> list[URL]:
    """
    Get all URLs with pagination.
    
    Args:
        db: Database session
        skip: Number of records to skip (offset)
        limit: Maximum number of records to return
        
    Returns:
        List of URL models
    """
    stmt = select(URL).where(URL.is_active == True).offset(skip).limit(limit)
    result = db.execute(stmt).scalars().all()
    return list(result)


def get_url_count(db: Session) -> int:
    """
    Get the total count of active URLs.
    
    Args:
        db: Database session
        
    Returns:
        Total count of active URLs
    """
    from sqlalchemy import func
    stmt = select(func.count()).select_from(URL).where(URL.is_active == True)
    return db.execute(stmt).scalar() or 0


def delete_url(db: Session, short_code: str) -> bool:
    """
    Delete a URL by its short code.
    
    Args:
        db: Database session
        short_code: The short code of the URL to delete
        
    Returns:
        True if the URL was deleted, False if not found
    """
    url = get_url_by_code(db, short_code)
    if not url:
        return False
    
    db.delete(url)
    db.commit()
    return True
