# Atmos Personal Carbon Ledger - Express Backend API

This is the backend server module for the Atmos personal carbon ledger, built with Express, Zod, and the Google Gemini API.

## Directory Structure
- [`server.ts`](file:///c:/Users/MCM/Desktop/Atmos/server/server.ts) — App initialization, global middlewares, and production asset routing.
- [`config/env.ts`](file:///c:/Users/MCM/Desktop/Atmos/server/config/env.ts) — Environment configurations schema-validated with Zod at startup.
- [`middleware/`](file:///c:/Users/MCM/Desktop/Atmos/server/middleware) — Input validators, rate limiters, cache-control headers, and centralized error envelopes.
- [`routes/`](file:///c:/Users/MCM/Desktop/Atmos/server/routes) — Route controllers separating concern layers.
- [`services/`](file:///c:/Users/MCM/Desktop/Atmos/server/services) — Caching engines, Gemini SDK wrappers, and atomic database debounced writers.
- [`types/index.ts`](file:///c:/Users/MCM/Desktop/Atmos/server/types/index.ts) — Shared TypeScript types.
- [`data/db.json`](file:///c:/Users/MCM/Desktop/Atmos/server/data/db.json) — Local storage JSON backup database.

---

## Environment Configurations (`.env`)

A sample configuration is provided in [`.env.example`](file:///c:/Users/MCM/Desktop/Atmos/.env.example). Customize the following keys:
- `PORT` (default: `5000`)
- `NODE_ENV` (e.g. `development`, `production`, `test`)
- `CORS_ORIGIN` (URL of client dashboard, e.g. `http://localhost:3000`)
- `GEMINI_API_KEY` (Optional. If not provided or invalid, Atmos Coach operates in a local fallback rule-based mode).

---

## REST API Specifications

### Dynamic Header Protections
All state-dependent endpoints write:
`Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`

---

### Endpoints

#### 1. System Health
* **`GET /api/health`**
  * Description: Simple monitoring health status check.
  * Response: `{ "status": "ok" }`

#### 2. Profile Management
* **`GET /api/profile`**
  * Response: `UserProfile` object (or `null`) containing regional and household details.
* **`POST /api/profile`**
  * Description: Saves user profile details. Invalidates the coach insights cache.
  * Request Body: `UserProfile` schema (Zod validated).
  * Response:
    ```json
    {
      "message": "Profile saved successfully",
      "profile": { ...savedProfileDetails }
    }
    ```

#### 3. Carbon Reduction Goals
* **`GET /api/goals`**
  * Response: `{ "targetPercent": number, "targetAnnualKg": number }`
* **`POST /api/goals`**
  * Description: Configures emission reduction targets. Invalidates insights cache.
  * Request Body: `{ "targetPercent": number, "targetAnnualKg": number }`
  * Response:
    ```json
    {
      "message": "Goals updated successfully",
      "goals": { "targetPercent": 15, "targetAnnualKg": 0 }
    }
    ```

#### 4. Activity Ledger (CRUD)
* **`GET /api/activities`**
  * Response: Sorted list of `ActivityLog[]` entries (date descending).
* **`POST /api/activities`**
  * Description: Logs a new activity. Calculates emissions dynamically using emission factors and invalidates insights cache.
  * Request Body: `Omit<ActivityLog, "id" | "emissions">`
  * Response: `{ "message": "Activity added successfully", "activity": ActivityLog }`
* **`PUT /api/activities/:id`**
  * Description: Modifies an existing log entry, recalculating emissions and invalidating cache.
  * Request Body: `Omit<ActivityLog, "id" | "emissions">`
  * Response: `{ "message": "Activity updated successfully", "activity": ActivityLog }`
* **`DELETE /api/activities/:id`**
  * Description: Deletes a ledger entry and invalidates cache.
  * Response: `{ "message": "Activity transaction deleted successfully." }`

#### 5. Atmos Coach Insights
* **`GET /api/insights`**
  * Description: Retrieves personalized carbon driver evaluations and action checklist recommendations.
  * Rate-Limiting: **Stricter limit** (max 30 requests/15m).
  * Caching: Cached in-memory keyed by a SHA-256 state hash of activities + goals.
  * Fallback behavior: If Gemini API fails or is unconfigured, responds with local rule-based insights and target progress reviews seamlessly.
  * Response: `AtmosCoachResponse` shape.

#### 6. Atmos Coach Interactive Chat
* **`POST /api/chat`**
  * Description: Conversational dialogue proxy with the Atmos Coach.
  * Rate-Limiting: **Stricter limit** (max 30 requests/15m).
  * Fallback behavior: Employs local keyword-analysis reply sets if Gemini is offline.
  * Request Body: `{ "message": string }`
  * Response: `{ "reply": string, "usingFallback": boolean }`
