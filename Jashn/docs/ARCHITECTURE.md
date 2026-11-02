# Architecture Specification — Jashn Celebration & Event Planner

## 1. Executive Architectural Overview

**Jashn** is a full-stack, GenAI-augmented Celebration & Event Planner designed with a strict **Hexagonal / Clean Architecture**. It isolates high-value, deterministic mathematical event planning logic from AI reasoning models, external networks, and UI rendering layers.

```
┌─────────────────────────────────────────────────────────────┐
│                 Presentation Layer (UI)                     │
│   Next.js App Router, Tailwind CSS, Lucide Icons, Zustand   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│       API Layer (Thin)      ││        Store Layer           │
│  Rate Limiting, Security,   ││  Client-side state, Undo,    │
│  CSP, Body size validation  ││  Language & Theme Management │
└──────────────┬──────────────┘└──────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│      AI Layer (src/ai)      ││    Pure Domain (src/domain)  │
│  - Gemini API Client        ││  - Pure deterministic math   │
│  - Ordered Model Failover   ││  - Exact budget summation    │
│  - Cooldown Management      ││  - Milestone timeline rules  │
│  - Prompt Injection Defense ││  - Vendor status lifecycle   │
│  - Response Cache (TTL)     ││  - RSVP & Headcount tracker  │
│  - Deterministic Fallback   ││  - What-if Scenario Engine   │
└──────────────┬──────────────┘└──────────────────────────────┘
               │                              ▲
               └──────────────────────────────┘
                 Delegates all calculations
```

---

## 2. Core Architectural Invariants

### 2.1 The Mathematical Integrity Invariant
> **Crucial Rule:** The AI must NEVER compute totals. All budget math is executed by pure domain functions and must sum exactly.

- LLMs are probabilistic token predictors and frequently hallucinate arithmetic sums or introduce subtle floating-point drift.
- In Jashn, when a user asks: *"Cut 10% from the total but keep the photographer"*, the AI extracts the parameters (`cutPercentage: 10`, `lockedCategories: ['photography']`).
- These parameters are dispatched to `domain/scenarios.ts` and `domain/budget.ts` (`rebalanceBudget`).
- The domain engine calculates integer allocations in INR, preserves locked amounts exactly, and applies the exact remainder to the final category so:
  $$\sum \text{allocatedAmount} \equiv \text{targetBudget}$$
- Guaranteed zero rounding discrepancies.

### 2.2 Layer Isolation & Dependency Direction
1. **`src/domain/` (Pure Core):**
   - No I/O, no network calls, no browser APIs, no imports from `src/ai/` or UI components.
   - 100% pure TypeScript functions, fully unit-tested with 99%+ code coverage.
2. **`src/ai/` (Intelligence Layer):**
   - Manages Gemini API client, failover policies, prompt sanitization, structured Zod parsing, response caching, and deterministic fallbacks.
   - Depends only on `src/domain/` for calculations.
3. **`src/app/api/` (API Layer):**
   - Thin ingress routes: `validate -> rate-limit -> call service -> respond`.
   - Max body size 50KB, strict security headers, and rate limiting.
4. **`src/components/` & `src/store/` (Presentation & State):**
   - Zustand manages state. Every file in `src/` is strictly under 200 lines.

---

## 3. Module Breakdown

| Module | Location | Responsibility | Line Count |
|---|---|---|---|
| Types | `src/domain/types.ts` | Complete domain types and data contracts | 140 lines |
| Budget | `src/domain/budget.ts` | Category totals, reserve margins, rebalance algorithms | 193 lines |
| Timeline | `src/domain/timeline.ts` | Milestone scheduling, urgency formatting, days-to-go | 180 lines |
| Vendors | `src/domain/vendors.ts` | Vendor checklists, deadline alerts, status lifecycles | 96 lines |
| Guests | `src/domain/guests.ts` | RSVP summaries, plus-ones headcounts, per-guest costs | 70 lines |
| Ideas | `src/domain/ideas.ts` | Curated cultural & celebration ideas | 102 lines |
| Scenarios | `src/domain/scenarios.ts` | What-if simulation engine (cuts, surges, deltas) | 124 lines |
| Templates | `src/domain/templates.ts` | Built-in celebration templates (Wedding, Birthday, etc.) | 134 lines |
| i18n | `src/domain/i18n.ts` | English, Hindi, and Marathi dictionaries & INR formatting | 175 lines |
| AI Config | `src/ai/config.ts` | Model priority chain (`gemini-2.5-flash` → `1.5-flash`) & cooldowns | 55 lines |
| AI Security | `src/ai/security.ts` | Prompt injection detection, input sanitization, delimiters | 75 lines |
| AI Schemas | `src/ai/schemas.ts` | Zod validation schemas for structured outputs | 59 lines |
| AI Cache | `src/ai/cache.ts` | In-memory LRU cache with TTL | 68 lines |
| AI Fallback | `src/ai/fallback.ts` | Deterministic offline rule engine for all queries | 127 lines |
| AI Service | `src/ai/service.ts` | Orchestration combining security, cache, failover & fallback | 128 lines |
| Planner Store | `src/store/plannerStore.ts` | Zustand store managing UI state and mutations | 198 lines |
| Rate Limiter | `src/lib/rateLimit.ts` | Sliding window rate limiter for API protection | 63 lines |

---

## 4. AI Layer Design & Failover Strategy

```
User Query
    │
    ▼
[ Security Guardrails (src/ai/security.ts) ]
    ├── Injections / Malicious Patterns? ──► Safe Rejection
    │
    ▼
[ Response Cache (src/ai/cache.ts) ]
    ├── Cache Hit? ────────────────────────► Return Cached Response
    │
    ▼
[ Check API Key ]
    ├── No API Key? ───────────────────────► Run Deterministic Fallback (built-in)
    │
    ▼
[ Ordered Model Failover Chain ]
    1. gemini-2.5-flash (Primary)
    2. gemini-1.5-flash (Fast Secondary)
    3. gemini-1.5-pro   (Deep Reasoning)
    ├── If 429/503/Error: Mark Cooldown & Try Next Model
    │
    ▼
[ Zod Validation (src/ai/schemas.ts) ]
    ├── Valid JSON? ───────────────────────► Apply Domain Math & Return (source: 'gemini')
    └── Malformed? ────────────────────────► Fallback to Deterministic Engine (source: 'built-in')
```

- **Source Attribution:** Every single response returned to the user explicitly denotes its source (`gemini` with model name or `built-in` with rule engine).
- **Offline Resilience:** The application is 100% functional without an internet connection or Gemini API key.
