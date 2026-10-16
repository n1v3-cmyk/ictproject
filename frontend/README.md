# CivicConnect — Frontend (Next.js)

The citizen and administrator interface for **CivicConnect**, a Smart Citizen Feedback and
Government Service Improvement System.

This app is **presentation only**. All persistence, validation, sentiment analysis, analytics, and
authorization live in a **Django/DRF + PostgreSQL backend** (built separately). The frontend talks to
that backend through a single typed `ApiClient` interface.

> Project-wide documentation (specification, architecture, task breakdown, API contract) lives in
> [`../docs`](../docs).

---

## Quick start

```bash
cd frontend
npm install
cp .env.example .env.local   # optional; defaults to mock mode
npm run dev
```

Open <http://localhost:3000>.

The app runs against an **in-browser mock adapter** by default, so it is fully usable with no backend.

### Demo administrator login

| Field | Value |
|-------|-------|
| Email | `admin@civicconnect.gov.in` |
| Password | `DemoAdmin@2026` |

(The login page also has a "fill demo credentials" button.)

---

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Values | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_API_MODE` | `mock` (default) · `http` | Selects the data adapter |
| `NEXT_PUBLIC_API_BASE_URL` | URL | Django API base (used in `http` mode) |

Switching to the real backend is a one-line change (`NEXT_PUBLIC_API_MODE=http`) once Django is running
against the contract in [`../docs/api-contract.md`](../docs/api-contract.md).

---

## Data-access architecture

```
Page / Component
   │
   ▼
Query hooks (src/hooks, src/context)      e.g. useFeedback()
   │
   ▼
ApiClient interface (src/api/client.ts)
   ├── mockClient  → seed data + localStorage   (default)
   └── httpClient  → fetch to Django + DTO mapping
   │
   ▼
Domain types (src/types/feedback.ts) → UI
```

- `src/api/` — the contract, both adapters, pure DTO↔domain mappers, error normalisation, mode switch.
- `src/domain/` — pure, unit-tested logic: sentiment, filtering, analytics, validation, CSV, formatting.
- `src/components/ui/` — reusable primitives (Button, Field, Card, Badge, States, Progress…).
- `src/app/(citizen)/` — public portal (home, feedback wizard, about, privacy).
- `src/app/admin/` — authenticated portal (dashboard, explorer, geo, reports, departments).

> **Note:** the mock adapter's login is a development stand-in. Real authorization is enforced
> server-side by Django; the client-side route guard is only a UX convenience.

---

## Quality gates

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test:run    # vitest (unit tests)
npm run build       # production build
```

All four must pass. Tests cover the sentiment baseline, filter semantics, analytics invariants
(dashboard totals equal filtered record counts), validation, error normalisation, CSV export,
DTO↔domain mapping against the frozen API contract, and a mock-adapter create → list → filter
round-trip.

---

## Sentiment analysis

Sentiment is produced by a **separate, replaceable module** (`src/domain/sentiment.ts`, mirrored on the
backend). It is an explicit, transparent heuristic (keyword + rating baseline), identified as
`heuristic-v1` in every result and labelled as such in the UI. It is **not** a trained model and is
never presented as AI.
