"""
Custom exceptions and error handling for the URL shortener application.

This module provides:
- Custom exception classes for different error scenarios
- Standardized error response schema
- Exception handlers for FastAPI integration
"""

from typing import Any, Optional
from pydantic import BaseModel
from fastapi import Request
from fastapi.responses import JSONResponse


# =============================================================================
# Error Response Schema
# =============================================================================


class ErrorDetail(BaseModel):
    """Standardized error detail schema."""
    
    code: str
    message: str
    status: int
    details: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standardized error response wrapper."""
    
    error: ErrorDetail


# =============================================================================
# Custom Exception Classes
# =============================================================================


class URLShortenerException(Exception):
    """Base exception for URL shortener application."""
    
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int,
        details: Optional[dict[str, Any]] = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)
    
    def to_response(self) -> ErrorResponse:
        """Convert exception to standardized error response."""
        return ErrorResponse(
            error=ErrorDetail(
                code=self.code,
                message=self.message,
                status=self.status_code,
                details=self.details
            )
        )


class URLNotFoundError(URLShortenerException):
    """Exception raised when a URL short code is not found."""
    
    def __init__(
        self,
        short_code: Optional[str] = None,
        message: Optional[str] = None
    ):
        details = {"short_code": short_code} if short_code else None
        super().__init__(
            code="URL_NOT_FOUND",
            message=message or "The requested short URL does not exist",
            status_code=404,
            details=details
        )


class URLExpiredError(URLShortenerException):
    """Exception raised when a URL has expired."""
    
    def __init__(
        self,
        short_code: Optional[str] = None,
        expired_at: Optional[str] = None,
        message: Optional[str] = None
    ):
        details = {}
        if short_code:
            details["short_code"] = short_code
        if expired_at:
            details["expired_at"] = expired_at
        
        super().__init__(
            code="URL_EXPIRED",
            message=message or "This short URL has expired and is no longer accessible",
            status_code=410,
            details=details if details else None
        )


class RateLimitError(URLShortenerException):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(
        self,
        retry_after: Optional[int] = None,
        message: Optional[str] = None
    ):
        details = {"retry_after_seconds": retry_after} if retry_after else None
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=message or "Too many requests. Please slow down and try again later",
            status_code=429,
            details=details
        )


class ValidationError(URLShortenerException):
    """Exception raised for validation errors."""
    
    def __init__(
        self,
        field: Optional[str] = None,
        reason: Optional[str] = None,
        message: Optional[str] = None
    ):
        details = {}
        if field:
            details["field"] = field
        if reason:
            details["reason"] = reason
        
        super().__init__(
            code="VALIDATION_ERROR",
            message=message or "The provided data is invalid",
            status_code=400,
            details=details if details else None
        )


class InternalServerError(URLShortenerException):
    """Exception raised for internal server errors."""
    
    def __init__(
        self,
        message: Optional[str] = None,
        error_id: Optional[str] = None
    ):
        details = {"error_id": error_id} if error_id else None
        super().__init__(
            code="INTERNAL_SERVER_ERROR",
            message=message or "An unexpected error occurred. Please try again later",
            status_code=500,
            details=details
        )


# =============================================================================
# Exception Handlers for FastAPI
# =============================================================================


async def url_shortener_exception_handler(
    request: Request,
    exc: URLShortenerException
) -> JSONResponse:
    """Handle custom URL shortener exceptions."""
    response = exc.to_response()
    return JSONResponse(
        status_code=exc.status_code,
        content=response.model_dump()
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions with a generic error response."""
    import uuid
    import logging
    
    # Generate error ID for tracking
    error_id = str(uuid.uuid4())[:8]
    
    # Log the error with full details
    logging.error(
        f"Unhandled exception [error_id={error_id}]: {type(exc).__name__}: {exc}",
        exc_info=True
    )
    
    error = InternalServerError(error_id=error_id)
    response = error.to_response()
    
    return JSONResponse(
        status_code=500,
        content=response.model_dump()
    )


async def http_exception_handler(
    request: Request,
    exc: Any
) -> JSONResponse:
    """Handle FastAPI HTTPException with standardized format."""
    from fastapi import HTTPException
    
    if isinstance(exc, HTTPException):
        # Map common HTTP status codes to error codes
        status_code_map = {
            400: ("BAD_REQUEST", "Bad request"),
            401: ("UNAUTHORIZED", "Authentication required"),
            403: ("FORBIDDEN", "Access denied"),
            404: ("NOT_FOUND", "Resource not found"),
            405: ("METHOD_NOT_ALLOWED", "Method not allowed"),
            409: ("CONFLICT", "Resource conflict"),
            422: ("UNPROCESSABLE_ENTITY", "Validation error"),
            429: ("RATE_LIMIT_EXCEEDED", "Too many requests"),
            500: ("INTERNAL_SERVER_ERROR", "Internal server error"),
            502: ("BAD_GATEWAY", "Bad gateway"),
            503: ("SERVICE_UNAVAILABLE", "Service unavailable"),
        }
        
        code, default_message = status_code_map.get(
            exc.status_code,
            ("ERROR", "An error occurred")
        )
        
        response = ErrorResponse(
            error=ErrorDetail(
                code=code,
                message=str(exc.detail) if exc.detail else default_message,
                status=exc.status_code
            )
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response.model_dump()
        )
    
    # Fallback for non-HTTP exceptions
    return await generic_exception_handler(request, exc)


async def rate_limit_exception_handler(
    request: Request,
    exc: Any
) -> JSONResponse:
    """Handle SlowAPI rate limit exceeded exceptions."""
    error = RateLimitError()
    response = error.to_response()
    
    return JSONResponse(
        status_code=429,
        content=response.model_dump(),
        headers={"Retry-After": "60"}
    )
