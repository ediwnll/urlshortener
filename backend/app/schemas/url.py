from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, HttpUrl, field_serializer, field_validator


class URLCreate(BaseModel):
    """Schema for creating a new shortened URL."""

    original_url: HttpUrl
    custom_alias: str | None = None
    expires_in_hours: int | None = None


class URLResponse(BaseModel):
    """Schema for URL response."""

    id: int
    short_code: str
    short_url: str
    original_url: str
    created_at: datetime
    expires_at: datetime | None = None
    click_count: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('created_at', 'expires_at')
    def serialize_datetime(self, dt: datetime | None) -> str | None:
        """Serialize datetime to ISO format with UTC timezone suffix."""
        if dt is None:
            return None
        # Ensure UTC timezone and ISO format with Z suffix
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')


class BulkURLCreate(BaseModel):
    """Schema for bulk URL creation request."""

    urls: list[URLCreate]
    
    @field_validator('urls')
    @classmethod
    def validate_urls_count(cls, v: list[URLCreate]) -> list[URLCreate]:
        """Validate that the list contains at most 10 URLs."""
        if len(v) > 10:
            raise ValueError('Maximum 10 URLs allowed per bulk request')
        if len(v) == 0:
            raise ValueError('At least one URL is required')
        return v


class BulkURLResultItem(BaseModel):
    """Schema for individual result in bulk URL response."""

    url: URLResponse | None = None
    error: str | None = None
    original_url: str


class BulkURLResponse(BaseModel):
    """Schema for bulk URL creation response."""

    results: list[BulkURLResultItem]
    success_count: int
    error_count: int
