# CivicConnect — Software Requirements Specification

> **Stage 1 of the SDD workflow.**
> Status: `Draft for approval` · Version 0.1.0 · Last updated 2026-10-17

---

## 1. Purpose

This document specifies **what** CivicConnect must do, before any implementation decisions are made.
It is the single source of truth for scope. Code must conform to this specification; if requirements
change, this document is updated first.

---

## 2. Problem Statement

Citizens interact with government services (land records, driving licences, hospitals, ration shops,
utilities, schools) but their experiences are rarely captured in a structured, analyzable form.
Departments therefore cannot see **recurring** problems, **where** they concentrate, or **which**
services consistently under-perform. Complaints are handled case-by-case and never aggregated.

**CivicConnect** collects structured citizen feedback, analyzes ratings and sentiment, identifies
recurring concerns, and surfaces insights to administrators through an analytics dashboard and a
geographic hotspot map.

---

## 3. Goals and Non-Goals

### 3.1 Goals
1. Let a citizen submit structured feedback in under ~3 minutes, optionally anonymously.
2. Persist feedback reliably on a server with validated, typed data.
3. Classify feedback sentiment (positive / neutral / negative) in a replaceable, clearly-labelled module.
4. Compute analytics (totals, averages, distributions, trends, department comparisons, recurring concerns)
   **from stored data only** — never hardcoded.
5. Let administrators search, filter, and inspect feedback; and manage departments, services, and locations.
6. Visualize aggregated, location-based feedback on an OpenStreetMap/Leaflet map.
7. Keep the design minimal, modern, consistent, and responsive (mobile → desktop).
8. Protect admin-only data and actions on the **server**.

### 3.2 Non-Goals (explicitly out of scope)
- Case-by-case grievance redressal or ticketing / dispute adjudication.
- Citizen accounts, login, or identity verification.
- Payment, notifications/SMS/email delivery, or escalation workflows.
- Real-time GPS collection or live incident tracking.
- A trained ML/LLM sentiment model (a heuristic baseline is specified instead, and must be labelled as such).
- Multi-tenant / multi-state deployment.
- Native mobile apps.

### 3.3 Future / Optional (only if time permits, never at the expense of the core)
- Bulk import of historical feedback.
- PDF report export (CSV is required; PDF is optional).
- Configurable rating dimensions per service.
- Rate limiting / CAPTCHA on public submissions.

---

## 4. User Roles

| Role | Description | Authentication |
|------|-------------|----------------|
| **Citizen** | Any member of the public. Submits feedback. May be anonymous. | None |
| **Administrator** | A nodal officer who views analytics, explores feedback, manages departments/services. | Yes (server session) |

There are no other roles. Administrator has a single privilege level for this project
(role field exists for future extension but only one role is required now).

---

## 5. Scope of Pages

### 5.1 Citizen portal (public)
1. **Home** — brief introduction, department categories, primary "Share Feedback" call to action.
2. **Service Selection** — choose district/local area, department, and service.
3. **Feedback Form** — ratings (overall + category), comments, suggestions.
4. **Description & Evidence** — optional longer description and optional attachments.
5. **Confirmation** — success message and a reference number.
6. **About** — what the platform is and how it works.
7. **Privacy** — what data is collected and how it is used. *(New — does not exist yet.)*

Steps 2–5 form one guided multi-step flow with a progress indicator and preserved input.
They are **not** separate routes; they are steps within `/feedback`.

### 5.2 Admin portal (protected)
6. **Admin Login** — authenticate.
7. **Analytics Dashboard** — essential metrics, sentiment distribution, trends, department comparison, common concerns.
8. **Feedback Explorer** — search, inspect, filter individual submissions.
9. **Geographic Analysis** — aggregated hotspots on OpenStreetMap.
10. **Reports & Insights** — department comparisons, recurring problems, trends, export.
11. **Department & Service Management** — manage departments, services, locations.

No further pages will be created; functionality that fits an existing page belongs in that page.

---

## 6. Functional Requirements & Acceptance Criteria

Each requirement has an ID, a priority (**M** = must, **S** = should, **C** = could), and testable
acceptance criteria.

### FR-1 — Feedback submission

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-1.1 | The citizen flow is a 3-step wizard + confirmation with a visible progress indicator. | M |
| FR-1.2 | Entered data is preserved when navigating between steps (forward and back). | M |
| FR-1.3 | Required fields: district, local area, department, service, overall rating, summary comment. | M |
| FR-1.4 | Detailed description is optional (not required to submit). | M |
| FR-1.5 | Category ratings (helpfulness, communication, professionalism, response time) are captured, 1–5. | M |
| FR-1.6 | Anonymous submission is the default and never requires name/contact. | M |
| FR-1.7 | Identified submission requires a name; contact is optional. | M |
| FR-1.8 | Optional attachments: JPG/PNG/WebP/PDF/MP4, each ≤ 8 MB, ≤ 5 files. | M |
| FR-1.9 | Accepted submissions are persisted server-side. | M |
| FR-1.10 | A unique reference number is returned and displayed on confirmation. | M |
| FR-1.11 | Repeated clicks cannot create duplicate records (submit button disabled while in flight; idempotency guard). | S |
| FR-1.12 | Errors are shown as human-readable messages; the form never crashes on failure. | M |

**Acceptance criteria (FR-1):** A citizen can complete all three steps, receive a reference number,
and the record appears in the admin Feedback Explorer with correct values. Submitting with the
browser offline or with an invalid field shows a clear error and preserves entered data. Double-clicking
Submit produces exactly one record.

---

### FR-2 — Sentiment analysis

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-2.1 | Feedback text is classified as positive, neutral, or negative. | M |
| FR-2.2 | Classification lives in an isolated module behind a stable interface. | M |
| FR-2.3 | The result (label + score + method) is stored on the feedback record. | M |
| FR-2.4 | Empty text and analysis failure are handled safely (never throws; falls back to neutral or a `FAILED` status). | M |
| FR-2.5 | The implementation is replaceable without changing callers. | M |
| FR-2.6 | The UI must not present keyword matching as advanced AI; it is labelled as a heuristic baseline. | M |

**Acceptance criteria (FR-2):** Unit tests feed known positive/negative/neutral/empty texts and assert
labels. The stored record's sentiment matches the module output. Replacing the module with a new
implementation requires no change outside the module (verified by interface test).

---

### FR-3 — Analytics

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-3.1 | Total feedback count, average overall rating, and sentiment distribution. | M |
| FR-3.2 | Feedback volume over time. | M |
| FR-3.3 | Department and service comparisons using average rating and volume. | M |
| FR-3.4 | Recurring concerns identified by a clearly documented method. | M |
| FR-3.5 | All figures are derived from stored data, never hardcoded. | M |
| FR-3.6 | Dashboard totals and chart values agree with each other and with the feedback records. | M |

**Recurring-concern method (documented):** feedback text is normalised and tokenised; stop-words are
removed; tokens are matched against a curated concern/commendation lexicon and counted per department
within the active date window. Concerns are ranked by *frequency* and by *association with negative
sentiment*. The method and its limitations are stated in the UI.

**Acceptance criteria (FR-3):** Given a known seed dataset, the dashboard's total, average, and sentiment
counts equal values computed independently from the same dataset (verified in tests). The "N" shown on a
chart equals the number of matching records.

---

### FR-4 — Filters

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-4.1 | Filter by district/local area, department, service, sentiment, rating, and date range. | M |
| FR-4.2 | A keyword search matches reference ID, comments, service, department, and location. | M |
| FR-4.3 | Filters behave consistently across Explorer, Analytics, and Geographic Analysis. | M |
| FR-4.4 | Filters are enforced server-side for data retrieval and mirrored client-side for the UI. | M |
| FR-4.5 | Selecting a department narrows the service list; changing it resets an invalid service. | M |

**Acceptance criteria (FR-4):** Applying identical filters on Analytics and Explorer yields the same
record count. Filters combine with AND semantics. Resetting filters restores the full dataset.

---

### FR-5 — Geographic analysis

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-5.1 | Render an OpenStreetMap base map via Leaflet with visible attribution. | M |
| FR-5.2 | Show aggregated feedback counts/ratings as markers by district (and local area where coordinates exist). | M |
| FR-5.3 | Respect the department, service, sentiment, and date filters. | M |
| FR-5.4 | Show a useful summary popup when a hotspot is selected. | M |
| FR-5.5 | Records without coordinates are handled without inventing locations. | M |
| FR-5.6 | Demonstration/seed data is clearly labelled as such. | M |
| FR-5.7 | The UI explains that a hotspot is a concentration of feedback, not a verified real-world problem. | M |

**Acceptance criteria (FR-5):** The map renders, markers reflect the filtered dataset, a district with
no coordinates is either omitted or shown in a clearly-labelled "location unavailable" list, attribution
is visible, and the hotspot disclaimer is present. Tested with empty, single, and clustered datasets.

---

### FR-6 — Department & service management

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-6.1 | Create, edit, and deactivate/activate departments. | M |
| FR-6.2 | Create, edit, and deactivate services belonging to a department. | M |
| FR-6.3 | Manage locations (districts/local areas) used by the citizen flow. | S |
| FR-6.4 | Departments/services referenced by existing feedback cannot be hard-deleted. | M |
| FR-6.5 | Changes are persisted and reflected in the citizen flow. | M |

**Acceptance criteria (FR-6):** A newly created department/service appears in the citizen Service
Selection step and in filters. Deactivating a department removes it from the citizen selection without
deleting its historical feedback. Attempting to delete a department with feedback returns a clear error.

---

### FR-7 — Reports & export

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-7.1 | Department comparison and trend views. | M |
| FR-7.2 | Recurring problems list for the active window. | M |
| FR-7.3 | CSV export of the filtered dataset, generated server-side. | M |
| FR-7.4 | PDF export. | C |

**Acceptance criteria (FR-7):** Exported CSV opens correctly, contains the filtered rows, and escapes
commas/quotes. Row count equals the explorer's filtered count for the same filters.

---

### FR-8 — Feedback explorer

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-8.1 | Tabular list with search, filters, sort, and pagination. | M |
| FR-8.2 | Detail view for a single record, including category ratings, sentiment, and attachments. | M |
| FR-8.3 | Attachments are viewable by an authorized admin. | M |
| FR-8.4 | Anonymous records never expose citizen identity in any view or API response. | M |

**Acceptance criteria (FR-8):** Searching a reference ID returns exactly that record. Anonymous records
show no name/contact anywhere. Pagination and sorting behave correctly at boundaries.

---

### FR-9 — Authentication & authorization

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-9.1 | Admin login with email + password. | M |
| FR-9.2 | Passwords are stored only as a strong hash (never plaintext). | M |
| FR-9.3 | Session is an HTTP-only, SameSite cookie. | M |
| FR-9.4 | Every admin API endpoint verifies authorization on the server. | M |
| FR-9.5 | Admin pages redirect unauthenticated users to login. | M |
| FR-9.6 | Logout invalidates the session server-side. | M |
| FR-9.7 | Failed logins return a generic message (no user enumeration). | S |

**Acceptance criteria (FR-9):** Calling a protected endpoint without a valid session returns `401`.
The admin UI hides behind the server check, not only a client flag. Password hashes are not reversible
and are not exposed by any API. Sessions expire.

---

## 7. Data Requirements

Normalised entities (details in `02-architecture.md`): **Feedback**, **Department**, **Service**,
**Location**, **Attachment**, **AdminUser**, **Session**.

Rules:
- Feedback references a department, a service, and a location by foreign key.
- Ratings are integers 1–5.
- Sentiment is an enum; a status field records analysis state.
- Coordinates are optional and only stored when justified; never invented for records that lack them.
- Anonymous feedback stores no name/contact.
- Constraints, uniqueness, and indexes are required (see architecture).
- Personal information collected is limited to what identified submission actually needs (name;
  optional contact).

---

## 8. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Security** | Server-side validation (Zod) on every mutating endpoint; parameterised DB access; upload type/size restriction; admin-only attachment access; no secrets in client code; env vars for DB config and session secret. |
| **Privacy** | Anonymous by default; no automatic device location; public endpoints never return private feedback or personal data; privacy page describing data use. |
| **Accessibility** | Keyboard-operable controls, visible focus states, labelled form fields, sufficient contrast, ARIA roles on custom widgets (star rating, progress). |
| **Responsiveness** | Usable at 360 px, 768 px, 1024 px, 1440 px. |
| **Design** | Sage-green primary, warm off-white background, dark-charcoal text, muted grey + subtle blush accents; restrained sentiment colours; one sans-serif family; whitespace, thin borders, subtle shadows; no heavy gradients or decorative illustration. |
| **Maintainability** | Strict TypeScript (no `any` in new code), feature/layer separation, no oversized files, no duplicated business logic, mock data isolated from production data access. |
| **Quality gates** | `tsc --noEmit` clean, ESLint clean (0 errors), tests pass, `next build` succeeds. |
| **Reliability** | Errors handled without crashing; loading, empty, and error states for every data view. |

---

## 9. Current-State Audit (what already exists)

Next.js 16.4 (App Router), React 19.3, TypeScript strict, Tailwind v4, Recharts, Leaflet, Lucide are
installed and working. The app is a **client-side prototype**:

| Area | Current state | Gap vs specification |
|------|---------------|----------------------|
| Persistence | `localStorage` via `FeedbackContext` | No server DB, no API layer, no server validation |
| Feedback flow | Working 4-step wizard in one 900-line file | Works, but oversized; needs server persistence + attachment storage |
| Sentiment | `sentimentAnalyzer.ts` keyword heuristic (labelled) | Reusable; needs a stable interface + stored status/method |
| Analytics | Dashboard computes from client state | Must compute from DB; verify totals |
| Filters | `FeedbackContext` client-side filtering | Must also work server-side |
| Geo | Leaflet + OSM, district aggregation | Reusable; needs server aggregates + missing-coordinate handling |
| Admin auth | Hardcoded plaintext password in client context | Must be server-side session + hashed password |
| Department mgmt | Working client-side CRUD | Must persist to DB and guard on server |
| Tests | None | Required for business rules, endpoints, filters |
| Lint | 9 errors, 75 warnings | Must be clean |
| Pages | No Privacy page | Add Privacy page |
| Scripts | `dev`, `build`, `start`, `lint` | Add `typecheck`, `test` |

**Preserve:** the design system, Tailwind setup, reusable UI primitives (`Card`, `Badge`, `StarRating`,
`Modal`), Lucide icons, Recharts usage, Leaflet map approach, mock/seed dataset content, and the overall
page structure.

---

## 10. Assumptions

1. The deployment target is a single Node server (local/dev first); SQLite is acceptable for persistence.
2. Administrators are seeded (no self-registration).
3. Seed/demo data is included and clearly labelled as demonstration data.
4. File storage is local disk in development.
5. Only one administrator role is needed now.
6. English-only UI.

---

## 11. Glossary

- **Feedback** — one citizen's evaluation of one service at one location.
- **Hotspot** — a geographic concentration of feedback; **not** a verified real-world problem.
- **Recurring concern** — a frequently reported issue token within a department/date window.
- **Reference number** — the human-readable unique identifier returned on submission.
- **Anonymous** — no name/contact stored for the record.
