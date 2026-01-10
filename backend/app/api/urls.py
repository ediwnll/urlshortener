"""URL management API endpoints."""

import io
from enum import Enum

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.schemas.url import URLCreate, URLResponse, BulkURLCreate, BulkURLResponse, BulkURLResultItem
from app.services.url_service import (
    AliasAlreadyExistsError,
    InvalidAliasError,
    create_short_url,
    delete_url,
    get_all_urls,
    get_url_by_code,
    get_url_count,
)

# Create limiter instance for this router
limiter = Limiter(key_func=get_remote_address)


class QRFormat(str, Enum):
    """Supported QR code output formats."""
    PNG = "png"
    SVG = "svg"


router = APIRouter(prefix="/api/urls", tags=["URLs"])


def _build_short_url(short_code: str) -> str:
    """Build the full short URL from a short code."""
    base_url = settings.BASE_URL.rstrip("/")
    return f"{base_url}/{short_code}"


def _url_to_response(url) -> URLResponse:
    """Convert a URL model to a URLResponse schema."""
    return URLResponse(
        id=url.id,
        short_code=url.short_code,
        short_url=_build_short_url(url.short_code),
        original_url=url.original_url,
        created_at=url.created_at,
        expires_at=url.expires_at,
        click_count=url.click_count,
        is_active=url.is_active,
    )


@router.post(
    "/",
    response_model=URLResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a shortened URL",
    responses={
        201: {"description": "URL successfully created"},
        400: {"description": "Invalid custom alias"},
        409: {"description": "Custom alias already exists"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("30/minute")
async def create_url(
    request: Request,
    url_data: URLCreate,
    db: Session = Depends(get_db),
) -> URLResponse:
    """
    Create a new shortened URL.
    
    - **original_url**: The URL to shorten (must be a valid HTTP/HTTPS URL)
    - **custom_alias**: Optional custom alias (3-20 alphanumeric chars, hyphens, underscores)
    
    Returns the created URL with its short code and full short URL.
    """
    try:
        url = create_short_url(
            db=db,
            original_url=str(url_data.original_url),
            custom_alias=url_data.custom_alias,
            expires_in_hours=url_data.expires_in_hours,
        )
        return _url_to_response(url)
    except InvalidAliasError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except AliasAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.post(
    "/bulk",
    response_model=BulkURLResponse,
    status_code=status.HTTP_200_OK,
    summary="Create multiple shortened URLs",
    responses={
        200: {"description": "Bulk URL creation completed (may contain partial failures)"},
        422: {"description": "Invalid request body"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("5/minute")
async def create_bulk_urls(
    request: Request,
    bulk_data: BulkURLCreate,
    db: Session = Depends(get_db),
) -> BulkURLResponse:
    """
    Create multiple shortened URLs in a single request.
    
    - **urls**: List of URLCreate objects (max 10 items)
    
    Returns results for each URL, including successful creations and individual errors.
    The entire batch won't fail if one URL fails.
    """
    results: list[BulkURLResultItem] = []
    success_count = 0
    error_count = 0
    
    for url_data in bulk_data.urls:
        original_url_str = str(url_data.original_url)
        try:
            url = create_short_url(
                db=db,
                original_url=original_url_str,
                custom_alias=url_data.custom_alias,
                expires_in_hours=url_data.expires_in_hours,
            )
            results.append(BulkURLResultItem(
                url=_url_to_response(url),
                original_url=original_url_str,
            ))
            success_count += 1
        except (InvalidAliasError, AliasAlreadyExistsError) as e:
            results.append(BulkURLResultItem(
                error=str(e),
                original_url=original_url_str,
            ))
            error_count += 1
        except Exception as e:
            results.append(BulkURLResultItem(
                error=f"Failed to create short URL: {str(e)}",
                original_url=original_url_str,
            ))
            error_count += 1
    
    return BulkURLResponse(
        results=results,
        success_count=success_count,
        error_count=error_count,
    )


@router.get(
    "/",
    response_model=list[URLResponse],
    summary="List all shortened URLs",
    responses={
        200: {"description": "List of URLs with pagination info"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("60/minute")
async def list_urls(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Max number of records to return"),
    db: Session = Depends(get_db),
) -> list[URLResponse]:
    """
    List all shortened URLs with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 10, max: 100)
    """
    urls = get_all_urls(db, skip=skip, limit=limit)
    return [_url_to_response(url) for url in urls]


@router.get(
    "/{short_code}",
    response_model=URLResponse,
    summary="Get URL details by short code",
    responses={
        200: {"description": "URL details"},
        404: {"description": "Short code not found"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("60/minute")
async def get_url(
    request: Request,
    short_code: str,
    db: Session = Depends(get_db),
) -> URLResponse:
    """
    Get details of a shortened URL by its short code.
    
    - **short_code**: The short code or custom alias to look up
    """
    url = get_url_by_code(db, short_code)
    
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Short URL '{short_code}' not found",
        )
    
    return _url_to_response(url)


@router.get(
    "/{short_code}/qr",
    summary="Generate QR code for a shortened URL",
    responses={
        200: {
            "description": "QR code image",
            "content": {
                "image/png": {},
                "image/svg+xml": {},
            },
        },
        404: {"description": "Short code not found"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("60/minute")
async def generate_qr_code(
    request: Request,
    short_code: str,
    size: int = Query(200, ge=50, le=1000, description="QR code size in pixels"),
    format: QRFormat = Query(QRFormat.PNG, description="Output format (png or svg)"),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """
    Generate a QR code image for a shortened URL.
    
    - **short_code**: The short code or custom alias
    - **size**: Image size in pixels (50-1000, default: 200)
    - **format**: Output format - png or svg (default: png)
    """
    url = get_url_by_code(db, short_code)
    
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Short URL '{short_code}' not found",
        )
    
    short_url = _build_short_url(short_code)
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=2,
    )
    qr.add_data(short_url)
    qr.make(fit=True)
    
    buffer = io.BytesIO()
    
    if format == QRFormat.SVG:
        # Generate SVG
        import qrcode.image.svg
        img = qr.make_image(image_factory=qrcode.image.svg.SvgImage)
        img.save(buffer)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="image/svg+xml",
            headers={"Content-Disposition": f"inline; filename={short_code}_qr.svg"},
        )
    else:
        # Generate PNG
        img = qr.make_image(fill_color="black", back_color="white")
        # Resize to requested size
        img = img.resize((size, size))
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={"Content-Disposition": f"inline; filename={short_code}_qr.png"},
        )


@router.delete(
    "/{short_code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a shortened URL",
    responses={
        204: {"description": "URL successfully deleted"},
        404: {"description": "Short code not found"},
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("30/minute")
async def delete_url_endpoint(
    request: Request,
    short_code: str,
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a shortened URL by its short code.
    
    - **short_code**: The short code or custom alias to delete
    """
    deleted = delete_url(db, short_code)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Short URL '{short_code}' not found",
        )
