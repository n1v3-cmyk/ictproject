# CivicConnect

A **Smart Citizen Feedback and Government Service Improvement System**.

Citizens rate and comment on government services; administrators see aggregated sentiment, trends,
department comparisons, and geographic concentrations — derived entirely from stored data.

Built with **Spec-Driven Development (SDD)**: specification → architecture → tasks → incremental
implementation → verification.

---

## Repository layout

```
ictproject/
├── docs/                    # SDD artefacts — read these first
│   ├── 01-specification.md  # Stage 1: requirements, scope, acceptance criteria
│   ├── 02-architecture.md   # Stage 2: layers, decisions (ADRs), data model, design system
│   ├── 03-tasks.md          # Stage 3: milestones, tasks, deps, status
│   └── api-contract.md      # Shared REST contract (frontend ↔ backend)
├── frontend/                # Next.js 16 (App Router) + TypeScript + Tailwind v4
└── backend/                 # (planned) Django + DRF + PostgreSQL — not yet created
```

---

## Architecture at a glance

```
Next.js frontend (this repo)  ──JSON/HTTPS──►  Django + DRF + PostgreSQL (later)
• citizen portal + admin portal                • models, validation, sentiment
• typed ApiClient with two adapters:           • analytics, auth, reports
    mock (in-browser, default) and http
```

The frontend is **presentation + client logic only** — no route handlers, no database. The Django
backend is implemented separately against `docs/api-contract.md`, so the frontend can be built and
demonstrated now and switched to the real API with one environment variable.

---

## Running the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Full details, environment variables, and the demo admin login are in
[`frontend/README.md`](./frontend/README.md).

---

## Quality gates (frontend)

```bash
cd frontend
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test:run    # vitest
npm run build       # production build
```

---

## Key principles baked into the implementation

- **Honest analysis.** Sentiment is a transparent heuristic module (`heuristic-v1`), replaceable and
  clearly labelled — never presented as a trained AI model.
- **Data-derived analytics.** Every metric, filter, and map layer is computed from stored feedback;
  nothing is hardcoded, and filters behave identically across Explorer, Analytics, and Geography.
- **Privacy by design.** Anonymous submissions never carry identity; no automatic device location;
  coordinates are never fabricated when unknown.
- **Server-authoritative security.** The client-side admin guard is UX only; real authorization is
  enforced by the backend.

---

## Status

- **Stage 1–3** (specification, architecture, tasks, API contract): complete → [`docs/`](./docs).
- **Frontend**: implemented against the mock adapter — citizen portal, admin portal, analytics,
  geography, reports, department management, design system, and a Vitest suite.
- **Backend (Django/DRF/PostgreSQL)**: not started; the contract and adapter boundary are ready for it.
