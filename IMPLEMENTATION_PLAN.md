# URL Shortener Implementation Plan

> A local-first URL shortener for learning backend and frontend development fundamentals

---

## Executive Summary

This document outlines the complete implementation plan for **Snip** — a URL shortener application built step-by-step to learn web development fundamentals. The focus is on building a fully functional local application before considering any deployment or cloud concepts.

**Learning Philosophy:** Master the basics first. Each phase builds on the previous one, introducing new concepts gradually.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Feature Specifications](#4-feature-specifications)
5. [Design Direction](#5-design-direction)
6. [Implementation Phases](#6-implementation-phases)
7. [Database Schema](#7-database-schema)
8. [API Specification](#8-api-specification)
9. [Development Workflow](#9-development-workflow)

---

## 1. Technology Stack

### Backend: Python with FastAPI

**Why this choice:**

| Criteria | Justification |
|----------|---------------|
| **Beginner-friendly** | Python is readable and has gentle learning curve |
| **Modern & Fast** | FastAPI is one of the fastest Python frameworks |
| **Auto-documentation** | Built-in Swagger/OpenAPI docs at `/docs` |
| **Type hints** | Learn Python typing with Pydantic validation |
| **Great for learning** | Clear error messages, excellent documentation |

**Key packages:**
- `fastapi` - Modern web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - Database ORM
- `pydantic` - Data validation
- `python-shortuuid` - Short code generation
- `python-dotenv` - Environment variables

### Frontend: React 18 + Vite + TypeScript

**Why this choice:**

| Criteria | Justification |
|----------|---------------|
| **Fast development** | Vite's HMR is near-instant; great DX |
| **Modern React** | Hooks, modern patterns |
| **Industry standard** | React skills are highly transferable |
| **Great tooling** | Excellent TypeScript support |

**Key packages:**
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management
- `tailwindcss` - Utility-first CSS
- `framer-motion` - Animations
- `recharts` - Analytics visualizations
- `date-fns` - Date formatting

### Database: SQLite

| Reason | Benefit |
|--------|---------|
| **Zero configuration** | No server setup required |
| **File-based** | Easy to inspect and reset |
| **SQL learning** | Learn real SQL syntax |
| **Portable** | Database is just a file |

---

## 2. Architecture Overview

### Local Development Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOCAL DEVELOPMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐         ┌─────────────┐         ┌──────────┐  │
│   │   Browser   │ ──────▶ │ Vite Dev    │ ──────▶ │  React   │  │
│   │  :5173      │         │   Server    │         │   App    │  │
│   └─────────────┘         └─────────────┘         └──────────┘  │
│          │                                                       │
│          │ API calls                                             │
│          ▼                                                       │
│   ┌─────────────┐         ┌─────────────┐         ┌──────────┐  │
│   │   FastAPI   │ ──────▶ │  Business   │ ──────▶ │  SQLite  │  │
│   │   :8000     │         │   Logic     │         │   DB     │  │
│   └─────────────┘         └─────────────┘         └──────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User visits** `http://localhost:5173` (React frontend)
2. **Frontend makes API calls** to `http://localhost:8000` (FastAPI backend)
3. **Backend processes requests** and interacts with SQLite database
4. **Database stores** URLs, clicks, and analytics data

---

## 3. Project Structure

```
urlshortener/
├── README.md
├── IMPLEMENTATION_PLAN.md
│
├── backend/
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   ├── .env                      # Local environment variables
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── config.py             # Configuration settings
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py         # Route aggregator
│   │   │   ├── urls.py           # URL CRUD endpoints
│   │   │   ├── redirect.py       # Redirect handler
│   │   │   └── analytics.py      # Analytics endpoints
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── url.py            # URL SQLAlchemy model
│   │   │   └── click.py          # Click event model
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── url.py            # Pydantic schemas for URLs
│   │   │   └── analytics.py      # Analytics schemas
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── url_service.py    # URL shortening logic
│   │   │   ├── analytics_service.py
│   │   │   └── shortcode.py      # Short code generation
│   │   │
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── connection.py     # Database connection
│   │   │   └── init_db.py        # Database initialization
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── validators.py     # URL validation helpers
│   │
│   └── tests/
│       ├── __init__.py
│       ├── test_urls.py
│       └── test_analytics.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── og-image.png
│   │
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Root component
│       ├── index.css             # Global styles + Tailwind
│       │
│       ├── components/
│       │   ├── ui/               # Reusable UI components
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Toast.tsx
│       │   │   └── Loader.tsx
│       │   │
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Layout.tsx
│       │   │
│       │   ├── url/
│       │   │   ├── UrlForm.tsx   # URL shortening form
│       │   │   ├── UrlCard.tsx   # Single URL display
│       │   │   ├── UrlList.tsx   # URL list view
│       │   │   └── UrlDetails.tsx
│       │   │
│       │   └── analytics/
│       │       ├── ClickChart.tsx
│       │       ├── StatsCard.tsx
│       │       └── ReferrerList.tsx
│       │
│       ├── pages/
│       │   ├── Home.tsx          # Landing + URL form
│       │   ├── Dashboard.tsx     # URL management
│       │   ├── Analytics.tsx     # Detailed analytics
│       │   └── NotFound.tsx      # 404 page
│       │
│       ├── hooks/
│       │   ├── useUrls.ts        # URL CRUD operations
│       │   ├── useAnalytics.ts   # Analytics data
│       │   └── useClipboard.ts   # Copy to clipboard
│       │
│       ├── services/
│       │   └── api.ts            # API client
│       │
│       ├── types/
│       │   └── index.ts          # TypeScript types
│       │
│       └── utils/
│           ├── formatters.ts     # Date, number formatters
│           └── validators.ts     # Client-side validation
│
└── scripts/
    └── dev.sh                    # Start dev servers
```

---

## 4. Feature Specifications

### Core Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **URL Shortening** | Convert long URLs to short codes (6-8 chars) | P0 |
| **Redirect Service** | Fast 301/302 redirects from short to original URL | P0 |
| **URL Validation** | Validate URLs before shortening | P0 |
| **Copy to Clipboard** | One-click copy of shortened URLs | P0 |
| **URL History** | View recently created URLs (stored locally) | P1 |

### Enhanced Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Custom Aliases** | User-defined short codes (e.g., `/my-link`) | P1 |
| **Click Analytics** | Track total clicks per URL | P1 |
| **QR Code Generation** | Generate QR codes for short URLs | P2 |
| **URL Expiration** | Set TTL for temporary links | P2 |
| **Bulk Shortening** | Shorten multiple URLs at once | P3 |

### Dashboard Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **URL Management** | List, search, filter URLs | P1 |
| **Analytics Dashboard** | Visualize click data over time | P2 |
| **Geographic Data** | Show clicks by country/region | P3 |
| **Device/Browser Stats** | Breakdown by user agent | P3 |
| **Referrer Tracking** | Track traffic sources | P2 |

### Technical Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Rate Limiting** | Prevent abuse (100 req/min default) | P0 |
| **Error Handling** | Graceful error pages and API responses | P0 |
| **Caching** | Cache redirects for performance | P1 |
| **API Documentation** | OpenAPI/Swagger docs | P2 |

---

## 5. Design Direction

### Aesthetic: **"Digital Brutalist"**

A bold, raw, and memorable design that breaks from generic SaaS aesthetics. Think: exposed structure, strong typography, intentional roughness with moments of refinement.

### Design Principles

1. **Raw & Structural** — Visible borders, exposed grid, no soft shadows
2. **High Contrast** — Black/off-white base with single electric accent
3. **Typographic Hierarchy** — Oversized display type, tight letter-spacing
4. **Intentional Brutality** — Chunky buttons, thick borders, no rounded corners
5. **Micro-Interactions** — Glitchy hovers, sharp transitions, screen shake on actions

### Color Palette

```css
:root {
  /* Base */
  --color-black: #0a0a0a;
  --color-white: #f5f5f0;
  --color-gray: #1a1a1a;
  
  /* Accent — Electric Lime */
  --color-accent: #d4ff00;
  --color-accent-dark: #a8cc00;
  
  /* Functional */
  --color-error: #ff3333;
  --color-success: #00ff88;
  
  /* Borders */
  --border-thick: 3px solid var(--color-white);
  --border-accent: 3px solid var(--color-accent);
}
```

### Typography

```css
/* Display — Bold, condensed, impactful */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

/* Body — Monospace for that raw, technical feel */
--font-display: 'Space Mono', monospace;
--font-body: 'Space Mono', monospace;

/* Sizes */
--text-hero: clamp(3rem, 10vw, 8rem);
--text-heading: clamp(1.5rem, 4vw, 3rem);
--text-body: 1rem;
--text-small: 0.875rem;
```

### Key Visual Elements

1. **The URL Input** — Massive, full-width, thick-bordered input that dominates the viewport
2. **Result Display** — Glitch animation on generation, pulsing accent border
3. **Stats Grid** — Exposed CSS grid with visible borders between cells
4. **Buttons** — Rectangular, thick border, inverted colors on hover
5. **Loading State** — Terminal-style typing animation

### Sample Component Aesthetic

```
┌──────────────────────────────────────────────────────────────┐
│ SNIP_                                          ░░░░░░░░░░░░  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ PASTE YOUR URL_                                        │  │
│  │ ▌                                                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  [ SHORTEN → ]                                               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  YOUR SNIPPED URL                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ██ snip.io/Xk9mP2  ████████████████████████ [ COPY ]  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐  │
│  │ CLICKS   │ CREATED  │ EXPIRES  │ STATUS               │  │
│  │ 0        │ JUST NOW │ NEVER    │ ● ACTIVE             │  │
│  └──────────┴──────────┴──────────┴──────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Local Development Setup (Week 1)

**Objective:** Establish project foundation with working dev environment

**What You'll Learn:**
- Python virtual environments
- FastAPI basics
- React + Vite setup
- How frontend and backend communicate

#### Tasks

- [x] Initialize project folder structure
- [x] Set up Python virtual environment
- [x] Install FastAPI and dependencies
- [x] Create basic FastAPI app with health endpoint
- [x] Set up frontend with Vite + React + TypeScript
- [x] Configure TailwindCSS with custom design tokens
- [x] Test that frontend can call backend API

#### Deliverables

1. [x] Backend responds on `localhost:8000/health`
2. [x] Frontend loads on `localhost:5173`
3. [x] Frontend can successfully call backend API

#### Backend Setup Commands

```bash
# Create and enter backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy python-dotenv shortuuid pydantic

# Save dependencies
pip freeze > requirements.txt
```

#### Frontend Setup Commands

```bash
# Initialize frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm install react-router-dom @tanstack/react-query axios
npm install tailwindcss @tailwindcss/vite
```

---

### Phase 2: Core Functionality (Week 2)

**Objective:** Implement URL shortening and redirect service

**What You'll Learn:**
- SQLAlchemy ORM basics
- FastAPI routing and request handling
- Pydantic data validation
- HTTP redirects

#### Tasks

- [x] Set up SQLite database with SQLAlchemy
- [x] Create URL model
- [x] Implement short code generation (shortuuid)
- [x] Build POST `/api/urls` endpoint (create short URL)
- [x] Build GET `/{code}` endpoint (redirect)
- [x] Add URL validation with Pydantic
- [x] Implement error handling

#### API Endpoints

```
POST /api/urls
  Body: { "original_url": "https://example.com/long/path" }
  Response: { "short_code": "Xk9mP2", "short_url": "http://localhost:8000/Xk9mP2", "original_url": "..." }

GET /{code}
  Response: 307 Redirect to original URL

GET /api/urls/{code}
  Response: { "short_code": "...", "original_url": "...", "created_at": "...", "clicks": 0 }
```

#### Short Code Generation Logic

```python
# app/services/shortcode.py
import shortuuid

def generate_short_code(length: int = 7) -> str:
    """Generate a URL-safe short code."""
    return shortuuid.ShortUUID().random(length=length)

def is_valid_custom_alias(alias: str) -> bool:
    """Check if custom alias is valid."""
    import re
    pattern = r'^[a-zA-Z0-9_-]{3,20}$'
    return bool(re.match(pattern, alias))
```

---

### Phase 3: Frontend UI (Week 3)

**Objective:** Build the brutalist-styled user interface

**What You'll Learn:**
- React component architecture
- TailwindCSS styling
- API integration with React Query
- Form handling in React

#### Tasks

- [x] Create base UI components (Button, Input, Card)
- [x] Build Header and Layout components
- [x] Implement Home page with URL form
- [x] Add URL shortening form with validation
- [x] Create result display with copy functionality
- [x] Add loading states and animations
- [x] Implement toast notifications
- [x] Build basic URL history (localStorage)

#### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   └── Main
│       ├── Home
│       │   ├── HeroSection
│       │   ├── UrlForm
│       │   │   ├── Input
│       │   │   └── Button
│       │   ├── UrlResult (conditional)
│       │   │   ├── ShortUrlDisplay
│       │   │   ├── CopyButton
│       │   │   └── StatsPreview
│       │   └── RecentUrls
│       │       └── UrlCard[]
│       └── Footer
```

#### Key Interactions

1. **Form Submit** — Glitch effect during processing
2. **URL Generated** — Slide-in with electric accent pulse
3. **Copy Click** — Screen micro-shake + toast
4. **Hover States** — Color inversion with sharp transition

---

### Phase 4: Additional Features (Week 4-5)

**Objective:** Enhance with analytics, dashboard, and advanced features

**What You'll Learn:**
- Database relationships (one-to-many)
- Data aggregation and analytics
- Chart visualization
- More complex React state management

#### Week 4: Analytics & Tracking

- [x] Create Click model with relationship to URL
- [x] Track clicks with metadata (user-agent, referrer, timestamp)
- [x] Build GET `/api/urls/{code}/analytics` endpoint
- [x] Create analytics service for data aggregation

#### Week 5: Dashboard & Management

- [x] Build Dashboard page with URL list
- [x] Add search and filter functionality
- [x] Create Analytics page with charts (recharts)
- [x] Implement URL deletion
- [x] Add custom alias feature
- [x] Build expiration feature (optional)

#### Analytics Data Structure

```python
# app/schemas/analytics.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ClickEvent(BaseModel):
    id: int
    url_id: int
    clicked_at: datetime
    user_agent: Optional[str]
    referrer: Optional[str]
    
class UrlAnalytics(BaseModel):
    total_clicks: int
    clicks_by_day: list[dict]  # [{"date": "2024-01-15", "count": 45}, ...]
    top_referrers: list[dict]  # [{"referrer": "twitter.com", "count": 45}, ...]
```

---

### Phase 5: Polish & Advanced Features (Week 6)

**Objective:** Add finishing touches and nice-to-have features

**What You'll Learn:**
- QR code generation
- Bulk operations
- Error handling best practices
- Performance optimization

#### Tasks

- [x] Add QR code generation for short URLs
- [x] Implement bulk URL shortening
- [x] Add rate limiting (slowapi)
- [ ] Improve error pages and messages
- [ ] Add loading skeletons
- [ ] Optimize database queries
- [ ] Write basic tests

---

## 7. Database Schema

### SQLite Schema

```sql
-- URLs table
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_alias TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    click_count INTEGER DEFAULT 0
);

CREATE INDEX idx_urls_short_code ON urls(short_code);

-- Clicks table
CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER NOT NULL,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    referrer TEXT,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

CREATE INDEX idx_clicks_url_id ON clicks(url_id);
```

### SQLAlchemy Models

```python
# app/models/url.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class URL(Base):
    __tablename__ = "urls"
    
    id = Column(Integer, primary_key=True, index=True)
    short_code = Column(String, unique=True, index=True, nullable=False)
    original_url = Column(String, nullable=False)
    custom_alias = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    click_count = Column(Integer, default=0)
    
    clicks = relationship("Click", back_populates="url", cascade="all, delete-orphan")
```

---

## 8. API Specification

### Base URL

- **Local:** `http://localhost:8000`

### Endpoints

#### Health Check

```
GET /health

Response 200:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Create Short URL

```
POST /api/urls

Request Body:
{
  "original_url": "https://example.com/very/long/path",
  "custom_alias": "my-link"  // optional
}

Response 201:
{
  "id": 1,
  "short_code": "Xk9mP2q",
  "short_url": "http://localhost:8000/Xk9mP2q",
  "original_url": "https://example.com/very/long/path",
  "created_at": "2024-01-15T10:30:00Z",
  "clicks": 0
}

Response 400 (Validation Error):
{
  "detail": "Invalid URL format"
}

Response 409 (Alias Taken):
{
  "detail": "Custom alias 'my-link' is already in use"
}
```

#### Redirect

```
GET /{short_code}

Response 307: Redirect to original URL
Response 404: Short URL not found
```

#### Get URL Details

```
GET /api/urls/{short_code}

Response 200:
{
  "id": 1,
  "short_code": "Xk9mP2q",
  "short_url": "http://localhost:8000/Xk9mP2q",
  "original_url": "https://example.com/very/long/path",
  "created_at": "2024-01-15T10:30:00Z",
  "clicks": 142,
  "is_active": true
}
```

#### Get URL Analytics

```
GET /api/urls/{short_code}/analytics

Response 200:
{
  "total_clicks": 142,
  "clicks_by_day": [
    { "date": "2024-01-15", "count": 45 },
    { "date": "2024-01-16", "count": 32 }
  ],
  "top_referrers": [
    { "referrer": "twitter.com", "count": 45 },
    { "referrer": "direct", "count": 38 }
  ]
}
```

#### List All URLs

```
GET /api/urls?skip=0&limit=20

Response 200:
{
  "urls": [...],
  "total": 45
}
```

#### Delete URL

```
DELETE /api/urls/{short_code}

Response 204: No content (success)
Response 404: URL not found
```

---

## 9. Development Workflow

### Getting Started

```bash
# 1. Clone and setup
git clone <repo-url>
cd urlshortener

# 2. Setup backend
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# 3. Setup frontend
cd ../frontend
npm install

# 4. Start development
# Terminal 1 (backend):
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 (frontend):
cd frontend
npm run dev
```

### Environment Variables

**Backend `.env`:**

```env
# Server
PORT=8000
BASE_URL=http://localhost:8000

# Database
DATABASE_URL=sqlite:///./urlshortener.db
```

**Frontend `.env`:**

```env
VITE_API_URL=http://localhost:8000
```

### Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI (auto-generated!) |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |

---

## Next Steps

1. **Test each feature** before moving to the next phase
2. **Use the auto-generated API docs** at `/docs` to test your endpoints
3. **Commit frequently** with descriptive messages

---

## Learning Resources

### Python & FastAPI

- [FastAPI Documentation](https://fastapi.tiangolo.com/) — Excellent tutorial included
- [SQLAlchemy ORM Tutorial](https://docs.sqlalchemy.org/en/20/orm/tutorial.html)
- [Pydantic Documentation](https://docs.pydantic.dev/)

### Frontend

- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)

### Tools

- [HTTPie](https://httpie.io/) — Friendly HTTP client for testing APIs
- [DB Browser for SQLite](https://sqlitebrowser.org/) — View your database

---

*This implementation plan is a living document. Update it as you progress through the phases.*
