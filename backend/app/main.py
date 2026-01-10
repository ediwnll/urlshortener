from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.urls import router as urls_router
from app.api.redirect import router as redirect_router
from app.api.analytics import router as analytics_router
from app.database.init_db import init_db

# Create limiter instance with IP-based key function
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="URL Shortener API",
    description="A simple URL shortener service",
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter

# Add rate limit exceeded exception handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add SlowAPI middleware
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint (no rate limit)."""
    return {"status": "healthy"}


# Include routers
# URLs API router (under /api/urls)
app.include_router(urls_router)

# Analytics router (under /api/urls/{short_code}/analytics)
app.include_router(analytics_router)

# Redirect router at root level (must be included last to avoid catching other routes)
app.include_router(redirect_router)
