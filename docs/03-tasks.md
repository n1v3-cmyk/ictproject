# CivicConnect — Task Breakdown & Progress

> **Stage 3 of the SDD workflow.**
> Status legend: ✅ done · 🔄 in progress · ⬜ todo · ⏸️ blocked
> Last updated 2026-10-17

Dependency column lists task IDs that must complete first. Tasks are ordered so a small, working system
exists before enhancements.

---

## M0 — Specification & planning

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T0.1 | Repository inspection & current-state audit | — | Audit table in `01-specification.md §9` | ✅ |
| T0.2 | Requirements specification | T0.1 | `docs/01-specification.md` | ✅ |
| T0.3 | Architecture & technical decisions | T0.2 | `docs/02-architecture.md` | ✅ |
| T0.4 | REST API contract | T0.3 | `docs/api-contract.md` | ✅ |
| T0.5 | Task breakdown | T0.3 | `docs/03-tasks.md` (this file) | ✅ |

---

## M1 — Design system & foundation

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T1.1 | Tailwind v4 `@theme` design tokens | M0 | Tokens in `globals.css` | ✅ |
| T1.2 | Replace arbitrary hex utilities with tokens | T1.1 | No `[#hex]` colour utilities remain (315 replacements, 21 files) | ✅ |
| T1.3 | UI primitives: `Button`, `Field` (Input/Select/Textarea), `Progress`, `States` | T1.1 | Components exist, typed, accessible | ✅ |
| T1.4 | `lib/cn.ts` + `lib/config.ts` | T1.1 | Utilities exist and are used | ✅ |
| T1.5 | npm scripts: `typecheck`, `test`, `test:run` | M0 | Scripts run | ✅ |
| T1.6 | Fix all ESLint errors | T1.2 | `npm run lint` → **0 errors** | ✅ |

> **Note:** the 66 ESLint *warnings* (unused imports, two `<img>` previews) were cleared in T8.10 —
> `npm run lint` now reports **0 problems**.

---

## M2 — Data-access layer (API client + adapters)

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T2.1 | `api/contract.ts`: wire DTOs, params, `Paginated<T>` | M0 | Types compile | ✅ |
| T2.2 | `api/errors.ts`: `ApiError` + DRF normaliser | T2.1 | Unit tests for both error shapes | ✅ |
| T2.3 | `api/client.ts`: `ApiClient` interface | T2.1 | All contract methods declared | ✅ |
| T2.4 | `api/mappers.ts` + `api/httpClient.ts`: pure DTO↔domain mappers + `fetch` impl | T2.3 | Compiles; mappers unit-tested | ✅ |
| T2.5 | `api/mock/store.ts`: localStorage-backed store seeded from seed | T2.1 | Persists across reloads | ✅ |
| T2.6 | `api/mock/mockClient.ts`: full `ApiClient` over the store | T2.3,T2.5 | Round-trip create→list→filter tests pass | ✅ |
| T2.7 | `api/index.ts`: mode switch via `NEXT_PUBLIC_API_MODE` | T2.4,T2.6 | Returns correct adapter | ✅ |
| T2.8 | Provider + hooks (`useFeedback`, `useApiClient`) with load/error state | T2.7 | Hooks expose loading/empty/error | ✅ |
| T2.9 | `domain/*`: UI types, filters, ratings, theme, format, validation, csv, analytics | T2.1 | Pure, unit-tested | ✅ |

> **Deviation:** hooks are provided through a single `FeedbackProvider`/`useFeedback()` context rather
> than one hook file per query. Public API is unchanged for existing pages.

---

## M3 — Citizen portal

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T3.1 | Split feedback wizard into hook + step components | T2.8 | No file > ~250 lines; no `setState`-in-effect | 🔄 |
| T3.2 | Mirror client validation; surface server field errors | T2.9 | Invalid input blocked with clear messages | ✅ |
| T3.3 | Submit via `createFeedback` with idempotency key; prevent double submit | T2.8 | One record per submit; reference shown | ✅ |
| T3.4 | Home page reads departments/stats from adapter | T2.8 | No mock imports in page | ✅ |
| T3.5 | **Privacy** page + navbar/footer links | T3.4 | Page renders, linked, responsive | ✅ |
| T3.6 | Attachment validation mirror (type/size/count) + preview + real `File` retained | T3.3 | Rejections explained; preview works | ✅ |

> **T3.1 status:** `setState`-in-effect anti-patterns removed (replaced by derived defaults) and the
> file now uses shared validation — but the wizard is still one large file. The physical component
> split remains.

---

## M4 — Admin shell, auth & core views

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T4.1 | Auth over adapter; token login; route guard in `admin/layout.tsx` | T2.8 | Unauthenticated → `/admin/login` | ✅ |
| T4.2 | Login page uses `login(email, password)`; demo creds labelled | T4.1 | Success → dashboard; failure → message | ✅ |
| T4.3 | Shared filters across Dashboard/Explorer/Geo (one `filters` state) | T2.9 | Identical filters → identical counts | ✅ |
| T4.4 | Dashboard KPIs/charts from stored records | T4.3 | Values match stored records | ✅ |
| T4.5 | Explorer: table, search, sort, pagination, detail, CSV export | T4.3 | Search by reference id returns it | 🔄 |
| T4.6 | Remove all `any` from charts | T4.4 | `npm run lint` → 0 errors | ✅ |

> **T4.5:** export currently builds CSV client-side from the filtered set (`domain/csv.ts`, tested for
> row-count parity). Wiring to the server `exportReportCsv` endpoint is the remaining step (T5.2).

---

## M5 — Analytics, reports & geography

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T5.1 | Reports page renders recurring concerns + trends | T4.3 | Renders from stored data | ✅ |
| T5.2 | Server-side CSV export via `exportReportCsv` | T5.1 | Row count = explorer count | ⬜ |
| T5.3 | Geo page aggregates respect filters | T4.3 | Markers match filtered data | ✅ |
| T5.4 | Missing-coordinate handling (never fabricated) | T5.3 | `coordinates: null`, tested | ✅ |
| T5.5 | Hotspot disclaimer + OSM attribution visible | T5.3 | Both present in UI | ✅ |
| T5.6 | Seed/demo data clearly labelled | T5.3 | Labelling present | ✅ |

> Analytics are computed from the in-memory dataset via the shared, unit-tested `domain/analytics.ts`,
> which the mock adapter also uses for its `/analytics/*` methods. This guarantees dashboard/explorer/
> geo counts agree. Server-side analytics calls are the `http`-mode path.

---

## M6 — Department & service management

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T6.1 | Departments CRUD via adapter (create/edit/deactivate) | T4.1 | Changes persist and appear in citizen flow | ✅ |
| T6.2 | Service CRUD within a department | T6.1 | Services appear in wizard + filters | ✅ |
| T6.3 | Deletion guarded (deactivate instead; `409` surfaced) | T6.2 | Clear error on referenced delete | ✅ |

---

## M7 — Tests

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T7.1 | Vitest setup + config (`vitest.config.mts`) | T1.5 | `npm run test:run` works | ✅ |
| T7.2 | Sentiment unit tests | T7.1,T2.9 | Pass | ✅ |
| T7.3 | Filter matcher tests | T7.1,T2.9 | Pass | ✅ |
| T7.4 | Mock-adapter round-trip + error-shape tests | T7.1,T2.6 | Pass | ✅ |
| T7.5 | Aggregation invariants: dashboard totals == filtered counts | T7.1,T2.9 | Pass | ✅ |
| T7.6 | Validation-mirror tests | T7.1,T2.9 | Pass | ✅ |
| T7.7 | DTO↔domain mapper tests (contract freeze) | T7.1,T2.4 | Pass | ✅ |

> **76 tests across 8 files, all passing** (`sentiment`, `filters`, `analytics`, `validation`, `errors`,
> `csv`, `mappers`, `mockClient`).

---

## M8 — Verification & hardening

| ID | Task | Deps | Done when | Status |
|----|------|------|-----------|--------|
| T8.1 | `npm run typecheck` clean | M3–M6 | Exit 0 | ✅ |
| T8.2 | `npm run lint` clean (0 errors) | M3–M6 | Exit 0 — **0 errors, 0 warnings** | ✅ |
| T8.3 | `npm run test:run` green | M7 | 76/76 pass | ✅ |
| T8.4 | `npm run build` succeeds | M3–M6 | 11 routes prerendered | ✅ |
| T8.5 | Responsive spot-check (360/768/1024/1440) + keyboard accessibility | M3–M6 | Usable, focusable | ⬜ |
| T8.6 | No public surface exposes anonymous identity | M4 | Verified in tests + `domain/csv.ts` | ✅ |
| T8.7 | `.env.example` + READMEs (root + frontend) | M0 | Documented | ✅ |
| T8.8 | Auth end-to-end test with a local Django API | T8.4 | ⏸️ blocked until backend exists | ⏸️ |
| T8.9 | Wire `httpClient` to real Django | T8.8 | ⏸️ blocked until backend exists | ⏸️ |
| T8.10 | Clear remaining ESLint warnings (unused imports) | T1.6 | `npm run lint` → **0 problems** | ✅ |
| T8.11 | Production runtime smoke test | T8.4 | `/`, `/privacy`, `/about`, `/feedback`, `/admin/login` → HTTP 200 | ✅ |

---

## Critical Path

```
M0 ─► M1 ─► M2 ─► M3 ─► M8.1–8.4  ✅ (all green)
              └──► M4 ─► M5
                    └──► M6
              └──► M7 ─► M8.3  ✅
```

**Minimum working system achieved:** M1 → M2 → M3 → M4, verified by typecheck, lint (0 errors),
58 unit tests, and a successful production build.

## Out of scope this session (backend)

`T8.8`, `T8.9`, and the entire `backend/` Django project are deferred. The API contract and adapter
boundary are designed so this work can proceed independently.
