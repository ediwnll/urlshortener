"""Common query patterns and utilities for database operations."""

from datetime import datetime, timedelta
from typing import Any, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.connection import Base


T = TypeVar("T", bound=Base)


class PaginatedResult:
    """Container for paginated query results."""

    def __init__(
        self,
        items: list[Any],
        total: int,
        page: int,
        page_size: int,
    ):
        self.items = items
        self.total = total
        self.page = page
        self.page_size = page_size
        self.total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        self.has_next = page < self.total_pages
        self.has_prev = page > 1

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses."""
        return {
            "items": self.items,
            "total": self.total,
            "page": self.page,
            "page_size": self.page_size,
            "total_pages": self.total_pages,
            "has_next": self.has_next,
            "has_prev": self.has_prev,
        }


def paginate(
    db: Session,
    query,
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResult:
    """
    Apply pagination to a query and return results with metadata.

    Args:
        db: Database session
        query: SQLAlchemy select statement
        page: Page number (1-indexed)
        page_size: Number of items per page

    Returns:
        PaginatedResult with items and pagination metadata
    """
    # Ensure valid pagination parameters
    page = max(1, page)
    page_size = max(1, min(100, page_size))  # Cap at 100 items per page

    # Calculate offset
    offset = (page - 1) * page_size

    # Get total count (create a count query from the original)
    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0

    # Apply pagination to original query
    paginated_query = query.offset(offset).limit(page_size)
    items = list(db.execute(paginated_query).scalars().all())

    return PaginatedResult(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


def date_range_filter(
    column,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> list:
    """
    Build date range filter conditions for a column.

    Args:
        column: SQLAlchemy column to filter on
        start_date: Start of range (inclusive)
        end_date: End of range (inclusive)

    Returns:
        List of filter conditions to use with where()
    """
    conditions = []
    if start_date:
        conditions.append(column >= start_date)
    if end_date:
        conditions.append(column <= end_date)
    return conditions


def get_date_range_presets() -> dict[str, tuple[datetime, datetime]]:
    """
    Get common date range presets.

    Returns:
        Dictionary mapping preset names to (start_date, end_date) tuples
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    return {
        "today": (today_start, now),
        "yesterday": (today_start - timedelta(days=1), today_start),
        "last_7_days": (today_start - timedelta(days=7), now),
        "last_30_days": (today_start - timedelta(days=30), now),
        "last_90_days": (today_start - timedelta(days=90), now),
        "this_month": (today_start.replace(day=1), now),
        "last_month": (
            (today_start.replace(day=1) - timedelta(days=1)).replace(day=1),
            today_start.replace(day=1) - timedelta(seconds=1),
        ),
    }


def count_by_date(
    db: Session,
    model,
    date_column,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    additional_filters: list | None = None,
) -> list[tuple[str, int]]:
    """
    Count records grouped by date.

    Args:
        db: Database session
        model: SQLAlchemy model class
        date_column: Column containing the date to group by
        start_date: Optional start date filter
        end_date: Optional end date filter
        additional_filters: Optional list of additional filter conditions

    Returns:
        List of (date_string, count) tuples ordered by date
    """
    conditions = []

    # Add date range filters
    conditions.extend(date_range_filter(date_column, start_date, end_date))

    # Add any additional filters
    if additional_filters:
        conditions.extend(additional_filters)

    query = (
        select(
            func.date(date_column).label("date"),
            func.count().label("count"),
        )
        .select_from(model)
        .group_by(func.date(date_column))
        .order_by(func.date(date_column))
    )

    if conditions:
        query = query.where(*conditions)

    results = db.execute(query).all()
    return [(str(row.date), row.count) for row in results]


def count_by_column(
    db: Session,
    model,
    group_column,
    limit: int = 10,
    additional_filters: list | None = None,
) -> list[tuple[Any, int]]:
    """
    Count records grouped by a specific column.

    Args:
        db: Database session
        model: SQLAlchemy model class
        group_column: Column to group by
        limit: Maximum number of results
        additional_filters: Optional list of additional filter conditions

    Returns:
        List of (value, count) tuples ordered by count descending
    """
    query = (
        select(
            group_column.label("value"),
            func.count().label("count"),
        )
        .select_from(model)
        .group_by(group_column)
        .order_by(func.count().desc())
        .limit(limit)
    )

    if additional_filters:
        query = query.where(*additional_filters)

    results = db.execute(query).all()
    return [(row.value, row.count) for row in results]


def exists_query(
    db: Session,
    query,
) -> bool:
    """
    Check if any records exist matching the query.

    More efficient than fetching records when you only need to check existence.

    Args:
        db: Database session
        query: SQLAlchemy select statement

    Returns:
        True if records exist, False otherwise
    """
    exists_stmt = select(func.count()).select_from(query.limit(1).subquery())
    count = db.execute(exists_stmt).scalar() or 0
    return count > 0


def bulk_insert(
    db: Session,
    model,
    records: list[dict],
    batch_size: int = 100,
) -> int:
    """
    Efficiently insert multiple records in batches.

    Args:
        db: Database session
        model: SQLAlchemy model class
        records: List of dictionaries containing record data
        batch_size: Number of records per batch

    Returns:
        Total number of records inserted
    """
    total_inserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        objects = [model(**record) for record in batch]
        db.add_all(objects)
        db.flush()  # Flush to get IDs without full commit
        total_inserted += len(batch)

    db.commit()
    return total_inserted


def get_stats_summary(
    db: Session,
    model,
    count_column=None,
    sum_column=None,
    filters: list | None = None,
) -> dict:
    """
    Get summary statistics for a model.

    Args:
        db: Database session
        model: SQLAlchemy model class
        count_column: Optional column for counting (defaults to model)
        sum_column: Optional column for summing
        filters: Optional list of filter conditions

    Returns:
        Dictionary with count and optional sum statistics
    """
    # Build count query
    if count_column:
        count_expr = func.count(count_column)
    else:
        count_expr = func.count()

    select_exprs = [count_expr.label("count")]

    if sum_column:
        select_exprs.append(func.coalesce(func.sum(sum_column), 0).label("total"))

    query = select(*select_exprs).select_from(model)

    if filters:
        query = query.where(*filters)

    result = db.execute(query).first()

    stats = {"count": result.count if result else 0}
    if sum_column:
        stats["total"] = result.total if result else 0

    return stats
