# CivicConnect — REST API Contract

> The **shared source of truth** between the Next.js frontend and the Django/DRF backend.
> Version 1.0.0 · Last updated 2026-10-17
> Consumer: `frontend/src/api/**` · Implementer: `backend/` (Django + DRF, built later)

---

## 1. Conventions

- **Base URL:** `{NEXT_PUBLIC_API_BASE_URL}` — e.g. `http://localhost:8000/api/v1`
- **Format:** JSON (UTF-8) except the create-feedback endpoint, which accepts `multipart/form-data` when
  attachments are present.
- **Auth:** token in the header `Authorization: Token <token>` (DRF `TokenAuthentication`).
- **Dates:** ISO-8601 UTC strings, e.g. `2026-10-12T09:30:00Z`.
- **IDs:** UUID strings.
- **Status codes:** `200` OK · `201` Created · `204` No Content · `400` validation · `401` unauth ·
  `403` forbidden · `404` not found · `409` conflict · `413` payload too large · `500` server error.

### 1.1 Pagination envelope (all list endpoints)

```json
{
  "count": 137,
  "next": "http://…/feedback/?page=3",
  "previous": "http://…/feedback/?page=1",
  "results": [ /* items */ ]
}
```

### 1.2 Error envelope

Validation (`400`):
```json
{ "overall_rating": ["Ensure this value is between 1 and 5."],
  "summary_comment": ["This field may not be blank."] }
```

Non-field (`401`, `403`, `404`, `409`, `500`):
```json
{ "detail": "Authentication credentials were not provided." }
```

The frontend normalises both into `ApiError { status, message, fieldErrors? }`.

### 1.3 Shared filter parameters

Accepted by `/feedback/`, `/analytics/summary/`, `/analytics/geographic/`, `/analytics/insights/`,
and `/reports/export/`:

| Param | Type | Description |
|-------|------|-------------|
| `district` | string | Exact district name |
| `local_area` | string | Exact local-area name (requires `district`) |
| `department` | uuid | Department id |
| `service` | uuid | Service id |
| `sentiment` | enum | `positive` \| `neutral` \| `negative` |
| `rating` | int | `1`–`5` |
| `date_from` | date | Inclusive lower bound (`YYYY-MM-DD`) |
| `date_to` | date | Inclusive upper bound |
| `search` | string | Matches reference id, comments, service, department, district, area |
| `ordering` | string | `created_at`, `-created_at`, `overall_rating`, `-overall_rating` |

List endpoints additionally accept `page`, `page_size`.

Unrecognised filters are ignored; invalid values return `400`.

---

## 2. Auth

### `POST /auth/login/` — public
```json
// request
{ "email": "admin@civicconnect.gov.in", "password": "••••••••" }
// 200
{ "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": { "id": "…", "email": "…", "name": "State Nodal Officer", "role": "admin" } }
// 401
{ "detail": "Unable to log in with provided credentials." }
```

### `POST /auth/logout/` — admin
`204 No Content` — deletes the caller's token.

### `GET /auth/me/` — admin
`200 { "id": "…", "email": "…", "name": "…", "role": "admin" }`

---

## 3. Feedback

### 3.1 `FeedbackDTO`
```json
{
  "id": "b7c1…",
  "reference_id": "CC-KL-2026-1042",
  "created_at": "2026-10-12T09:30:00Z",
  "location": { "state": "Kerala", "district": "Ernakulam",
                "local_area": "Kanayannur (Kochi)",
                "latitude": 9.97, "longitude": 76.28 },
  "department": { "id": "…", "name": "Motor Vehicles Department (MVD)", "code": "MVD" },
  "service":    { "id": "…", "name": "Driving License Renewal", "code": "MVD-01" },
  "overall_rating": 2,
  "category_ratings": { "helpfulness": 3, "communication": 2,
                        "professionalism": 2, "response_time": 1 },
  "structured_answers": { "timely_delivery": "significant_delay",
                          "process_clarity": "confusing", "digital_access_used": true },
  "summary_comment": "Portal stuck during biometric verification.",
  "detailed_description": "…",
  "sentiment": "negative",
  "sentiment_score": 24,
  "sentiment_status": "completed",
  "sentiment_method": "heuristic-v1",
  "keywords": ["delay", "waiting"],
  "is_anonymous": true,
  "citizen_name": null,
  "citizen_contact": null,
  "attachments": [
    { "id": "…", "file_name": "screenshot.png", "mime_type": "image/png",
      "size_bytes": 480000, "download_url": "/api/v1/attachments/…/" }
  ]
}
```

> **Privacy:** for `is_anonymous = true`, `citizen_name` and `citizen_contact` **must** be `null` in every
> response. The backend must never return them for anonymous records.

### 3.2 `POST /feedback/` — **public** (create)

Accepts `multipart/form-data` (preferred; supports attachments) **or** `application/json` (no files).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `department` | uuid | ✅ | must exist & be active |
| `service` | uuid | ✅ | must belong to `department` |
| `district` | string | ✅ | |
| `local_area` | string | ✅ | |
| `overall_rating` | int 1–5 | ✅ | |
| `helpfulness` / `communication` / `professionalism` / `response_time` | int 1–5 | ✅ | |
| `timely_delivery` | enum | ✅ | `yes`\|`minor_delay`\|`significant_delay` |
| `process_clarity` | enum | ✅ | `very_clear`\|`acceptable`\|`confusing` |
| `digital_access_used` | bool | ✅ | |
| `summary_comment` | string | ✅ | 10–300 chars |
| `detailed_description` | string | ❌ | ≤ 5000 chars |
| `is_anonymous` | bool | ✅ | |
| `citizen_name` | string | ✅ if identified | |
| `citizen_contact` | string | ❌ | |
| `attachments[]` | file(s) | ❌ | ≤ 5 files; ≤ 8 MB each; jpg/png/webp/pdf/mp4 |

**Server behaviour on success (`201`):**
1. Validate everything server-side (authoritative).
2. Resolve/create the `Location` for `(state, district, local_area)`; copy coordinates only if known.
3. Run the sentiment module; store `sentiment`, `sentiment_score`, `sentiment_status`, `sentiment_method`.
4. Generate a unique `reference_id` (`CC-KL-<year>-<n>`).
5. Store attachments (metadata in DB, bytes on disk/object storage).
6. Return the full `FeedbackDTO`.

Rejections: `400` invalid · `409` duplicate reference collision (retried internally) ·
`413` file too large · `415` unsupported media type.

**Idempotency:** the client sends an `Idempotency-Key` header (a UUID generated once per wizard session).
The server returns the original `201` body again (same `id`/`reference_id`) for a repeated key instead of
creating a duplicate.

### 3.3 `GET /feedback/` — admin
Query: shared filters + `page`, `page_size`, `ordering`. Returns paginated `FeedbackDTO[]`.

### 3.4 `GET /feedback/{id}/` — admin
`200 FeedbackDTO` · `404` if absent or not visible.

### 3.5 `DELETE /feedback/{id}/` — admin
`204 No Content`.

---

## 4. Attachments

### `GET /attachments/{id}/` — admin
Streams the stored file with its `Content-Type`. `403` if unauthorized, `404` if absent.

---

## 5. Departments & Services

### 5.1 `GET /departments/` — public
Returns **active** departments with nested active services. Admins may pass `?include_inactive=true`
to receive all. `200 { "results": [DepartmentDTO] }` (unpaginated).

### 5.2 `DepartmentDTO`
```json
{ "id": "…", "name": "Health & Family Welfare", "code": "HFW",
  "description": "…", "icon_name": "Stethoscope",
  "contact_email": "…", "nodal_officer": "…", "is_active": true,
  "services": [ { "id": "…", "name": "…", "code": "HLT-01",
                  "description": "…", "category": "Healthcare",
                  "average_resolution_days": 3, "is_active": true } ] }
```

### 5.3 Mutations — admin
| Method | Path | Body |
|--------|------|------|
| POST | `/departments/` | `{name, code, description?, icon_name?, contact_email?, nodal_officer?}` |
| PATCH | `/departments/{id}/` | partial, incl. `is_active` |
| DELETE | `/departments/{id}/` | `409` if referenced by feedback (use deactivate) |
| POST | `/services/` | `{department, name, code, description?, category?, average_resolution_days?}` |
| PATCH | `/services/{id}/` | partial, incl. `is_active` |
| DELETE | `/services/{id}/` | `409` if referenced by feedback (use deactivate) |

---

## 6. Locations

### `GET /locations/` — public
```json
{ "results": [
  { "id": "…", "state": "Kerala", "district": "Ernakulam",
    "local_area": "Kanayannur (Kochi)",
    "latitude": 9.97, "longitude": 76.28 },
  { "id": "…", "state": "Kerala", "district": "Wayanad",
    "local_area": "Mananthavady", "latitude": null, "longitude": null }
] }
```
`latitude`/`longitude` may be `null`. The frontend must handle a `null` coordinate set without inventing
one (FR-5.5).

---

## 7. Analytics

### 7.1 `GET /analytics/summary/` — admin
Accepts the shared filters.
```json
{
  "total_feedback": 137,
  "average_rating": 3.72,
  "sentiment": { "positive": 78, "neutral": 26, "negative": 33 },
  "sentiment_percentages": { "positive": 57, "neutral": 19, "negative": 24 },
  "volume_over_time": [
    { "date": "2026-10-01", "positive": 4, "neutral": 2, "negative": 3, "total": 9 }
  ],
  "department_comparison": [
    { "department_id": "…", "code": "MVD", "name": "Motor Vehicles…",
      "average_rating": 2.9, "count": 24 }
  ],
  "top_concerns":     [ { "term": "delay", "count": 18, "negative_count": 15 } ],
  "top_commendations":[ { "term": "efficient", "count": 12 } ],
  "sentiment_method": "heuristic-v1"
}
```
Invariant: `sentiment.positive + neutral + negative == total_feedback`.

### 7.2 `GET /analytics/geographic/` — admin
Aggregated by district (and local area where coordinates exist).
```json
{ "results": [
  { "district": "Ernakulam", "local_area": null,
    "latitude": 9.98, "longitude": 76.30,
    "total": 24, "average_rating": 2.9,
    "sentiment": { "positive": 8, "neutral": 4, "negative": 12 },
    "hotspot_level": "high" }
] }
```
`hotspot_level ∈ { "low", "moderate", "high" }`. Records whose location has no coordinates are returned
with `latitude`/`longitude` `null` and are rendered in a separate "location unavailable" summary rather
than plotted. `hotspot_level` is a *concentration* indicator, **not** a verified real-world problem.

### 7.3 `GET /analytics/insights/` — admin
```json
{
  "recurring_concerns": [
    { "term": "delay", "count": 18, "negative_count": 15,
      "departments": ["MVD", "KSEB"], "trend": "rising" }
  ],
  "department_comparison": [ /* as in summary */ ],
  "trends": [ { "period": "2026-10", "total": 44, "average_rating": 3.6,
                "delta_vs_previous": -0.2 } ],
  "method": "frequency + negative-association over curated lexicon, windowed by date_from/date_to"
}
```
"Recurring concerns" is a **documented heuristic** (frequency × negative association over a curated
lexicon within the active window). The response states the method so the UI can label it honestly.

---

## 8. Reports

### `GET /reports/export/?format=csv` — admin
Accepts the shared filters. Returns `text/csv` with
`Content-Disposition: attachment; filename="civicconnect-feedback-YYYY-MM-DD.csv"`.
Columns: `reference_id, created_at, district, local_area, department, service, overall_rating,
helpfulness, communication, professionalism, response_time, sentiment, sentiment_score, summary_comment,
is_anonymous`. CSV escaping must be correct (commas/quotes/newlines). Row count equals the filtered
`/feedback/` count.

---

## 9. Permission Matrix

| Endpoint | Anonymous | Admin |
|----------|:---------:|:-----:|
| `POST /feedback/` | ✅ | ✅ |
| `GET /departments/`, `/services/`, `/locations/` | ✅ (active only) | ✅ (all) |
| `POST /auth/login/` | ✅ | — |
| Everything else | ❌ `401` | ✅ |

Denied admin endpoints return `401` when unauthenticated and `403` when authenticated but not staff.

---

## 10. Frontend ↔ Contract Mapping

| Contract method | `ApiClient` method |
|-----------------|--------------------|
| `POST /auth/login/` | `login(email, password)` |
| `POST /auth/logout/` | `logout()` |
| `GET /auth/me/` | `getCurrentAdmin()` |
| `POST /feedback/` | `createFeedback(input)` |
| `GET /feedback/` | `listFeedback(params)` |
| `GET /feedback/{id}/` | `getFeedback(id)` |
| `DELETE /feedback/{id}/` | `deleteFeedback(id)` |
| `GET /departments/` | `listDepartments(includeInactive?)` |
| `POST/PATCH/DELETE /departments/…` | `createDepartment`, `updateDepartment`, `deleteDepartment` |
| `POST/PATCH/DELETE /services/…` | `createService`, `updateService`, `deleteService` |
| `GET /locations/` | `listLocations()` |
| `GET /analytics/summary/` | `getAnalyticsSummary(params)` |
| `GET /analytics/geographic/` | `getGeographicAggregates(params)` |
| `GET /analytics/insights/` | `getInsights(params)` |
| `GET /reports/export/` | `exportReportCsv(params)` |

The `mockClient` in `frontend/src/api/mock/` implements this exact surface so the UI is identical
against either backend.
