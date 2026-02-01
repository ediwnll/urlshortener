"""URL shortening business logic service."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session, load_only

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


def check_code_exists(db: Session, code: str) -> bool:
    """
    Efficiently check if a short code or alias exists.
    Uses load_only to fetch minimal data.
    
    Args:
        db: Database session
        code: The short code or custom alias to check
        
    Returns:
        True if the code exists, False otherwise
    """
    stmt = (
        select(URL.id)
        .where((URL.short_code == code) | (URL.custom_alias == code))
        .limit(1)
    )
    result = db.execute(stmt).scalar_one_or_none()
    return result is not None


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
        
        # Check if custom alias already exists (optimized query)
        if check_code_exists(db, custom_alias):
            raise AliasAlreadyExistsError(
                f"Custom alias '{custom_alias}' is already in use"
            )
        
        short_code = custom_alias
    else:
        # Generate a unique short code
        for _ in range(max_retries):
            short_code = generate_short_code()
            if not check_code_exists(db, short_code):
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
        ((URL.short_code == code) | (URL.custom_alias == code)) & (URL.is_active == True)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_url_for_redirect(db: Session, code: str) -> tuple[int, str] | None:
    """
    Optimized query to get only the data needed for redirect.
    
    Args:
        db: Database session
        code: The short code or custom alias to look up
        
    Returns:
        Tuple of (url_id, original_url) if found, None otherwise
    """
    stmt = (
        select(URL.id, URL.original_url, URL.expires_at)
        .where(
            ((URL.short_code == code) | (URL.custom_alias == code)) 
            & (URL.is_active == True)
        )
    )
    result = db.execute(stmt).first()
    
    if not result:
        return None
    
    url_id, original_url, expires_at = result
    
    # Check expiration
    if expires_at is not None:
        now = datetime.now(timezone.utc)
        expires_at_tz = expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at
        if now > expires_at_tz:
            return None
    
    return url_id, original_url


def increment_clicks(db: Session, url: URL) -> None:
    """
    Increment the click count for a URL.
    
    Args:
        db: Database session
        url: The URL model to update
    """
    url.click_count += 1
    db.commit()


def increment_clicks_by_id(db: Session, url_id: int) -> None:
    """
    Increment the click count for a URL using its ID.
    Uses an efficient UPDATE statement without loading the full model.
    
    Args:
        db: Database session
        url_id: The ID of the URL to update
    """
    stmt = (
        update(URL)
        .where(URL.id == url_id)
        .values(click_count=URL.click_count + 1)
    )
    db.execute(stmt)
    db.commit()


def get_all_urls(
    db: Session,
    skip: int = 0,
    limit: int = 10,
) -> list[URL]:
    """
    Get all URLs with pagination, ordered by creation date (newest first).
    
    Args:
        db: Database session
        skip: Number of records to skip (offset)
        limit: Maximum number of records to return
        
    Returns:
        List of URL models
    """
    stmt = (
        select(URL)
        .where(URL.is_active == True)
        .order_by(URL.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = db.execute(stmt).scalars().all()
    return list(result)


def get_urls_summary(
    db: Session,
    skip: int = 0,
    limit: int = 10,
) -> list[dict]:
    """
    Get URL summary with only essential columns for listing.
    More efficient than loading full models.
    
    Args:
        db: Database session
        skip: Number of records to skip (offset)
        limit: Maximum number of records to return
        
    Returns:
        List of dictionaries with URL summary data
    """
    stmt = (
        select(
            URL.id,
            URL.short_code,
            URL.original_url,
            URL.custom_alias,
            URL.created_at,
            URL.click_count,
        )
        .where(URL.is_active == True)
        .order_by(URL.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    results = db.execute(stmt).all()
    return [
        {
            "id": r.id,
            "short_code": r.short_code,
            "original_url": r.original_url,
            "custom_alias": r.custom_alias,
            "created_at": r.created_at,
            "click_count": r.click_count,
        }
        for r in results
    ]


def get_url_count(db: Session) -> int:
    """
    Get the total count of active URLs.
    
    Args:
        db: Database session
        
    Returns:
        Total count of active URLs
    """
    from sqlalchemy import func
    stmt = select(func.count(URL.id)).where(URL.is_active == True)
    return db.execute(stmt).scalar() or 0


def delete_url(db: Session, short_code: str) -> bool:
    """
    Soft delete a URL by its short code (sets is_active to False).
    
    Args:
        db: Database session
        short_code: The short code of the URL to delete
        
    Returns:
        True if the URL was deleted, False if not found
    """
    # Use an efficient UPDATE instead of loading + deleting
    stmt = (
        update(URL)
        .where(
            ((URL.short_code == short_code) | (URL.custom_alias == short_code))
            & (URL.is_active == True)
        )
        .values(is_active=False)
    )
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0


def hard_delete_url(db: Session, short_code: str) -> bool:
    """
    Permanently delete a URL by its short code.
    
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


def batch_create_urls(
    db: Session,
    urls: list[dict],
    max_retries: int = 5,
) -> list[URL]:
    """
    Batch create multiple shortened URLs efficiently.
    
    Args:
        db: Database session
        urls: List of dicts with 'original_url', optional 'custom_alias', 'expires_in_hours'
        max_retries: Maximum retries for generating unique codes
        
    Returns:
        List of created URL models
    """
    created_urls = []
    
    # Pre-generate all short codes to minimize individual queries
    codes_needed = sum(1 for u in urls if not u.get("custom_alias"))
    generated_codes = []
    
    attempts = 0
    while len(generated_codes) < codes_needed and attempts < codes_needed * max_retries:
        code = generate_short_code()
        if not check_code_exists(db, code) and code not in generated_codes:
            generated_codes.append(code)
        attempts += 1
    
    code_index = 0
    for url_data in urls:
        custom_alias = url_data.get("custom_alias")
        expires_in_hours = url_data.get("expires_in_hours")
        
        if custom_alias:
            if not is_valid_custom_alias(custom_alias):
                continue
            if check_code_exists(db, custom_alias):
                continue
            short_code = custom_alias
        else:
            if code_index >= len(generated_codes):
                continue
            short_code = generated_codes[code_index]
            code_index += 1
        
        expires_at = None
        if expires_in_hours and expires_in_hours > 0:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
        
        url = URL(
            short_code=short_code,
            original_url=str(url_data["original_url"]),
            custom_alias=custom_alias,
            expires_at=expires_at,
        )
        db.add(url)
        created_urls.append(url)
    
    # Commit all at once for better performance
    db.commit()
    
    # Refresh all to get IDs
    for url in created_urls:
        db.refresh(url)
    
    return created_urls
