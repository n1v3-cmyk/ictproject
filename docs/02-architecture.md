# CivicConnect — Architecture & Technical Plan

> **Stage 2 of the SDD workflow.**
> Status: `Draft for approval` · Version 0.2.0 · Last updated 2026-10-17
> Supersedes v0.1 (which assumed a Node/Next backend).

---

## 1. System Overview

CivicConnect is a **two-application system**:

```
┌──────────────────────────────┐        JSON over HTTPS        ┌───────────────────────────────┐
│  Next.js frontend (this repo)│  ───────────────────────────► │  Python backend (later)       │
│  • App Router UI             │  ◄─────────────────────────── │  Django + DRF + PostgreSQL    │
│  • Typed API client          │   Bearer token auth          │  • Models + migrations        │
│  • Swappable data adapter    │                              │  • Validation + sentiment     │
└──────────────────────────────┘                              │  • Analytics + auth           │
                                                              └───────────────────────────────┘
```

**The Next.js app contains no backend logic.** No route handlers, no server actions, no database.
It is a presentation + client-application layer that talks to the Django REST API.

### 1.1 Why a swappable adapter

The Django backend is built later. So that the frontend can be developed and demonstrated now —
and later switch to the real API **without UI changes** — all data access goes through a single
`ApiClient` interface with two implementations:

| Implementation | When | Storage |
|----------------|------|---------|
| `mockClient` | Default now (`NEXT_PUBLIC_API_MODE=mock`) | In-browser seed data + `localStorage`, wrapped in DRF-shaped responses |
| `httpClient` | Later (`NEXT_PUBLIC_API_MODE=http`) | Real Django API via `fetch` |

Both return identical DTOs. UI code never knows which is active.

---

## 2. Architectural Layers (frontend)

| Layer | Responsibility | Location |
|-------|----------------|----------|
| **Presentation** | Pages, layouts, reusable components, client interactions | `src/app/**`, `src/components/**` |
| **Application (client)** | Wizard state, form validation mirror, query hooks, filter state | `src/hooks/**`, `src/context/**` |
| **Data access** | `ApiClient` contract + `http`/`mock` adapters + error normalisation | `src/api/**` |
| **Domain** | Shared UI types, filter rules, rating/format helpers, theme tokens | `src/domain/**` |

Business rules that must be authoritative (rating bounds, reference generation, sentiment,
final validation, authorization) live in the **Django backend**. The frontend mirrors validation
only for UX; it never trusts the client.

---

## 3. Repository & Folder Structure

```
ictproject/
├── docs/                          # SDD artefacts (spec, architecture, tasks, API contract)
├── frontend/                      # Next.js 16 App Router + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css        # Tailwind @theme design tokens + base styles
│   │   │   ├── not-found.tsx
│   │   │   ├── (citizen)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx            # Home
│   │   │   │   ├── feedback/page.tsx   # 3-step wizard + confirmation
│   │   │   │   ├── about/page.tsx
│   │   │   │   └── privacy/page.tsx    # NEW
│   │   │   └── admin/
│   │   │       ├── layout.tsx          # shell + auth guard
│   │   │       ├── login/page.tsx
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── feedback/page.tsx
│   │   │       ├── geo/page.tsx
│   │   │       ├── reports/page.tsx
│   │   │       └── departments/page.tsx
│   │   ├── api/                   # data-access layer (client side of the API)
│   │   │   ├── contract.ts        # DTOs, query params, Paginated<T>
│   │   │   ├── client.ts          # ApiClient interface
│   │   │   ├── errors.ts          # ApiError + DRF error normalisation
│   │   │   ├── mappers.ts         # pure DTO ↔ domain mappers (unit-tested)
│   │   │   ├── httpClient.ts      # fetch implementation (Django)
│   │   │   ├── mock/              # browser implementation
│   │   │   │   ├── mockClient.ts
│   │   │   │   ├── store.ts
│   │   │   │   └── seed.ts
│   │   │   ├── provider.tsx       # React context + query hooks
│   │   │   └── index.ts           # mode switch (mock | http)
│   │   ├── domain/
│   │   │   ├── types.ts           # UI-facing model types
│   │   │   ├── filters.ts         # FilterState + pure matchers
│   │   │   ├── ratings.ts         # rating labels, sentiment palette
│   │   │   ├── theme.ts           # chart/map colour constants
│   │   │   └── format.ts          # date/number formatting
│   │   ├── components/
│   │   │   ├── ui/                # Card, Badge, Button, Input, Select, Textarea,
│   │   │   │                      # Modal, StarRating, Progress, EmptyState, ErrorState
│   │   │   ├── citizen/           # Navbar, Footer, Stepper, DepartmentCard
│   │   │   └── admin/             # Sidebar, Header, FilterBar, GeographicMap, StatCard
│   │   ├── hooks/                 # useFeedbackList, useAnalytics, useAuth, ...
│   │   └── lib/
│   │       ├── config.ts          # env access (API base URL, mode)
│   │       └── cn.ts              # className merge helper
│   ├── tests/                     # Vitest unit tests
│   └── vitest.config.ts
└── backend/                       # (LATER) Django + DRF + PostgreSQL project
```

`backend/` is intentionally **not created yet**. Its shape is specified in §9 so the contract and the
frontend are already aligned when it is built.

---

## 4. Technical Decisions (ADR summary)

| # | Decision | Rationale | Alternatives rejected |
|---|----------|-----------|-----------------------|
| D1 | Keep **Next.js 16 + TS strict + Tailwind v4** as installed | Already present, modern, spec-required | Rewrite in another stack |
| D2 | Backend is **Django + DRF + PostgreSQL** | User decision; batteries-included ORM, migrations, auth, admin | FastAPI/Flask |
| D3 | Frontend talks to the API only through an **`ApiClient` interface** | Enables mock now, real API later, no UI churn; testable | Hard-coding fetch calls in components |
| D4 | `NEXT_PUBLIC_API_MODE` selects `mock`/`http` | One-line switch; no code changes | Build-time branching |
| D5 | **No data fetching library** (no SWR/React Query) | Small app; a ~60-line hook over `ApiClient` suffices; avoids dependencies | SWR, React Query |
| D6 | Design tokens in Tailwind v4 **`@theme`** | Central palette, removes ~50 duplicated hex literals | Arbitrary values everywhere |
| D7 | **No `any`** in new/edited code; chart tooltips typed | Spec requires strict typing; fixes existing lint errors | Leave `any` |
| D8 | Sentiment stays a **heuristic module** behind an interface, labelled as such | Honest, replaceable; backend will own the authoritative copy | Pretend it is ML |
| D9 | **Vitest** for unit tests | Fast, TS-native, minimal config | Jest (heavier), none |
| D10 | Attachments: metadata in DB, bytes on server; frontend only previews before upload | Keeps large blobs out of app state | Base64 in DB |
| D11 | Admin auth = **token** from Django (DRF), stored in memory + `sessionStorage`; all admin calls carry it | Simple for SPA; matches DRF TokenAuthentication; replaced by cookie/JWT later if desired | Client-only flag (rejected — spec requires server enforcement) |

> **Note on D3/D11:** the mock adapter simulates auth and authorization so the UX is complete, but it is
> **explicitly a development stand-in**. Real enforcement happens in Django. No admin-only data is ever
> present in the public bundle.

---

## 5. API Contract (summary)

Full detail in [`api-contract.md`](./api-contract.md). Base URL: `NEXT_PUBLIC_API_BASE_URL`
(e.g. `http://localhost:8000/api/v1`). Auth: `Authorization: Token <token>`.

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/auth/login/` | public | Obtain token |
| POST | `/auth/logout/` | admin | Invalidate token |
| GET | `/auth/me/` | admin | Current admin |
| POST | `/feedback/` | public | Create feedback (+ optional attachments) |
| GET | `/feedback/` | admin | List / search / filter (paginated) |
| GET | `/feedback/{id}/` | admin | Retrieve one |
| DELETE | `/feedback/{id}/` | admin | Delete one |
| GET | `/attachments/{id}/` | admin | Download an attachment |
| GET | `/departments/` | public (active) / admin (all) | List departments |
| POST/PATCH/DELETE | `/departments/{id}/` | admin | Manage departments |
| GET | `/services/?department={id}` | public | List services |
| POST/PATCH/DELETE | `/services/{id}/` | admin | Manage services |
| GET | `/locations/` | public | Districts + local areas |
| GET | `/analytics/summary/` | admin | KPIs, sentiment, timeline, department comparison |
| GET | `/analytics/geographic/` | admin | Aggregates by district / local area |
| GET | `/analytics/insights/` | admin | Recurring concerns, trends |
| GET | `/reports/export/?format=csv` | admin | Server-generated CSV |

**Shared filter query params** (used by `/feedback/`, all `/analytics/*`, `/reports/export/`):
`district`, `local_area`, `department`, `service`, `sentiment`, `rating`, `date_from`, `date_to`,
`search`, `ordering`, `page`, `page_size`.

**List envelope (DRF pagination):**
```json
{ "count": 42, "next": "…", "previous": null, "results": [ … ] }
```

**Error envelope (DRF-normalised on the client):**
```json
{ "detail": "message" }            // 401/403/404/500
{ "field_name": ["message"] }      // 400 validation
```

---

## 6. Domain Model (authoritative, for the Django backend)

### 6.1 Entities

**Department** — `id (UUID)`, `name`, `code (unique)`, `description`, `icon_name`, `contact_email`,
`nodal_officer`, `is_active`, `created_at`, `updated_at`.

**Service** — `id (UUID)`, `department (FK → Department, PROTECT, related_name="services")`, `name`,
`code (unique)`, `description`, `category`, `average_resolution_days (nullable)`, `is_active`.

**Location** — `id (UUID)`, `state`, `district`, `local_area`, `latitude (nullable)`,
`longitude (nullable)`. `unique_together = (state, district, local_area)`.
Coordinates are optional; absence is valid and must never be fabricated.

**Feedback** — `id (UUID)`, `reference_id (unique, e.g. CC-KL-2026-1042)`, `department (FK, PROTECT)`,
`service (FK, PROTECT)`, `location (FK, PROTECT)`, `overall_rating (1–5)`, `helpfulness`,
`communication`, `professionalism`, `response_time (1–5)`, `timely_delivery (enum)`,
`process_clarity (enum)`, `digital_access_used (bool)`, `summary_comment`, `detailed_description`,
`sentiment (enum: POSITIVE|NEUTRAL|NEGATIVE)`, `sentiment_score (0–100)`,
`sentiment_status (enum: PENDING|COMPLETED|FAILED)`, `sentiment_method`, `is_anonymous (bool)`,
`citizen_name (blank)`, `citizen_contact (blank)`, `created_at`, `updated_at`.

**Attachment** — `id (UUID)`, `feedback (FK, PROTECT, related_name="attachments")`, `file`,
`file_name`, `mime_type`, `size_bytes`, `created_at`.

**AdminUser** — Django `AUTH_USER_MODEL` (email login, `is_staff`). Passwords hashed by Django.

**Token** — `rest_framework.authtoken.Token`, one per admin session.

### 6.2 Constraints & indexes

- `CHECK` constraints: all five ratings `BETWEEN 1 AND 5`; `sentiment_score BETWEEN 0 AND 100`.
- `reference_id` unique; `Department.code`, `Service.code` unique.
- Indexes: `Feedback(created_at)`, `Feedback(department)`, `Feedback(service)`,
  `Feedback(location)`, `Feedback(sentiment)`, `Feedback(overall_rating)`.
- FKs use `PROTECT` so referenced departments/services/locations cannot be hard-deleted (supports FR-6.4).
- Deactivation (`is_active=False`) is the soft-delete path for departments and services.

### 6.3 Enumerations

- `Sentiment`: `POSITIVE`, `NEUTRAL`, `NEGATIVE`
- `SentimentStatus`: `PENDING`, `COMPLETED`, `FAILED`
- `TimelyDelivery`: `YES`, `MINOR_DELAY`, `SIGNIFICANT_DELAY`
- `ProcessClarity`: `VERY_CLEAR`, `ACCEPTABLE`, `CONFUSING`

---

## 7. Frontend Data Flow

```
Page / Component
   │  uses
   ▼
Query hook (src/hooks)            e.g. useFeedbackList(filters)
   │  calls
   ▼
ApiClient (src/api/client.ts)     interface: listFeedback, createFeedback, getSummary, …
   │  implemented by
   ├── mockClient  → seed data + localStorage, DRF-shaped output
   └── httpClient  → fetch(API_BASE_URL + path, { Authorization: Token })
   │  returns / throws
   ▼
DTOs (src/api/contract.ts)  ──map──►  domain types (src/domain/types.ts)
                                        │
                                        ▼
                                   UI components
```

- **Loading / empty / error** states are handled by a small `AsyncState<T>` helper so every view behaves
  consistently (satisfies the data-layer requirement).
- **Filters** live in one `FilterContext` so Dashboard, Explorer, and Geo share identical semantics.
- **Validation** is mirrored in `domain/validation.ts` for immediate UX feedback, but the server remains
  authoritative and its field errors are surfaced inline.

---

## 8. Sentiment Module Design

Interface (both languages):

```
analyze(text: string, overallRating: int, categoryAverage: float) -> {
  sentiment: 'positive' | 'neutral' | 'negative',
  score: 0..100,
  keywords: string[],
  method: string,
  status: 'completed' | 'failed'
}
```

- Frontend copy: `src/domain/sentiment.ts` — used only for the mock adapter and for tests.
- Backend copy (later): `feedback/sentiment/analyzer.py` — authoritative.
- Empty text → `neutral`, score 50, no keywords. Exceptions are caught → `status='failed'`, sentiment
  `neutral`. The signature is stable so a trained model can replace the body without touching callers.
- UI must label it a **heuristic baseline**, never "AI".

---

## 9. Planned Backend Shape (built later, for alignment only)

```
backend/
├── manage.py
├── requirements.txt            # django, djangorestframework, psycopg[binary], django-cors-headers
├── config/                     # settings, urls, wsgi/asgi
│   └── settings.py             # env-driven: DATABASE_URL, SECRET_KEY, CORS_ALLOWED_ORIGINS
└── feedback/
    ├── models.py               # Department, Service, Location, Feedback, Attachment
    ├── serializers.py          # DRF serializers (validation lives here + model constraints)
    ├── views.py                # ViewSets + APIViews (permissions: IsAdminUser for admin routes)
    ├── urls.py
    ├── permissions.py
    ├── sentiment/analyzer.py   # interchangeable sentiment module
    ├── analytics.py            # aggregation + recurring-concern method
    ├── pagination.py
    ├── admin.py
    └── migrations/
```

Cross-cutting: `django-cors-headers` to allow the Next.js origin; `DEFAULT_PERMISSION_CLASSES =
IsAuthenticated` with explicit `AllowAny` on create-feedback and public catalogue reads.

---

## 10. Design System

Palette (Tailwind v4 `@theme` tokens in `globals.css`):

| Token | Value | Use |
|-------|-------|-----|
| `sage-600` | `#46664F` | Primary (buttons, active states) |
| `sage-700` | `#38523F` | Primary hover / strong text |
| `sage-200` | `#CADACF` | Sage borders |
| `sage-100` | `#EBF2ED` | Sage surfaces, chips |
| `canvas` | `#FBFBF9` | Page background (warm off-white) |
| `line` | `#E5E9E6` | Hairline borders |
| `ink` | `#1F2421` | Primary text (dark charcoal) |
| `muted` | `#5E6661` | Secondary text |
| `blush` | `#E8D7D8` | Subtle accent |
| `pos` / `warn` / `neg` | `#22C55E` / `#F59E0B` / `#EF4444` | Sentiment colours (restrained) |

Rules: one sans-serif family, generous whitespace, thin borders (`border-line`), subtle shadows only,
no heavy gradients, no decorative illustrations. Citizen portal = welcoming; admin portal = information-first.
Both responsive from 360 px up.

---

## 11. Testing Strategy

| Layer | Tool | What is tested |
|-------|------|----------------|
| Domain rules | Vitest | sentiment labels/scores, rating helpers, filter matchers, validation mirror |
| Data adapter | Vitest | mock client: create → list → filter → paginate round-trip; error shapes |
| Aggregation | Vitest | analytics totals/percentages agree with a fixed fixture (asserts FR-3.6, FR-4.3) |
| Components | (optional) Testing Library | star rating keyboard use, form step validation |
| Build gates | npm scripts | `typecheck`, `lint`, `test`, `build` |

Fixtures are fixed and deterministic so dashboard-vs-explorer totals can be asserted equal.

---

## 12. Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | client | Django API base (e.g. `http://localhost:8000/api/v1`) |
| `NEXT_PUBLIC_API_MODE` | client | `mock` (default now) or `http` (later) |

A committed `.env.example` documents both. No secrets are placed in `NEXT_PUBLIC_*`.

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend not ready | No real persistence | Mock adapter with identical contract; swap via one env var |
| Contract drift between frontend and Django | Integration breakage | `api-contract.md` is the shared source of truth; types in `contract.ts` mirror it |
| Oversized components (current wizard is ~900 lines) | Maintainability | Split into `Step*` components + `useFeedbackWizard` hook |
| Hex literals scattered across files | Inconsistent design | `@theme` tokens + mechanical replacement of arbitrary values |
| Existing lint errors | Fails acceptance | Fix `any`, unused imports, setState-in-effect |
| Leaflet SSR issues | Build/runtime errors | Dynamically imported, client-only (already the pattern) |
| Postgres availability later | Backend can't run | Backend is out of scope this session; documented setup |

---

## 14. Definition of Done (this session)

- Frontend fully API-driven via `ApiClient` (mock + http adapters), no `localStorage` reads outside the mock store.
- Citizen flow works end-to-end against the mock adapter; Privacy page added.
- Admin portal works against the mock adapter with a simulated server-style token login.
- Design tokens centralised; lint clean; no `any` in touched files.
- Vitest tests for sentiment, filters, aggregation, and the mock adapter pass.
- `typecheck`, `lint`, `test`, `build` all succeed.
- `api-contract.md` is complete enough for the Django backend to be implemented against it.
