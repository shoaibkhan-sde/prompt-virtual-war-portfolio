# Testing Strategy & Quality Assurance — Jashn

## 1. Overview & Test Pyramid

**Jashn** adheres to a strict Test-Driven Development (TDD) approach. Because celebration planning requires accurate budgeting and high reliability, our test suite covers multiple layers of the application pyramid:

```
          ▲
         / \
        / E2E \       Playwright (Full flow, Language, Dark/Light, E2E)
       /───────\
      /   Axe   \     @axe-core/playwright (Automated WCAG AA Audits)
     /───────────\
    / Integration \   API Routes, Rate Limiter, AI Orchestrator
   /───────────────\
  /   Domain Unit   \ Vitest (99.6% Coverage, Pure Math, Edge Cases)
 /───────────────────\
```

---

## 2. Test Execution Commands

| Command | Purpose | Tools |
|---|---|---|
| `npm run test` | Run all unit & integration test suites | Vitest |
| `npm run test:coverage` | Run unit tests and generate V8 coverage metrics | Vitest + v8 |
| `npm run test:e2e` | Run end-to-end browser workflows & axe audits | Playwright + Chromium |
| `npm run lint` | Verify Next.js and React code quality & types | ESLint + TypeScript |

---

## 3. Unit Test Coverage Metrics (Vitest + V8)

Target threshold required by project specifications is 95%+. Our actual test results exceed all targets:

```
 % Coverage report from v8
---------------|---------|----------|---------|---------|-------------------
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------|---------|----------|---------|---------|-------------------
All files      |    99.6 |    93.22 |     100 |    99.6 |                   
 ai            |    99.7 |    94.04 |     100 |    99.7 |                   
  cache.ts     |     100 |      100 |     100 |     100 |                   
  config.ts    |     100 |      100 |     100 |     100 |                   
  fallback.ts  |     100 |     87.5 |     100 |     100 |                   
  schemas.ts   |     100 |      100 |     100 |     100 |                   
  security.ts  |     100 |      100 |     100 |     100 |                   
  service.ts   |   98.75 |    94.44 |     100 |   98.75 | 97                
 domain        |   99.56 |    92.81 |     100 |   99.56 |                   
  budget.ts    |     100 |     92.5 |     100 |     100 | 36,49-51          
  guests.ts    |     100 |    94.11 |     100 |     100 | 58                
  i18n.ts      |   98.78 |       75 |     100 |   98.78 | 17-18             
  ideas.ts     |   97.82 |    93.33 |     100 |   97.82 | 90-91             
  scenarios.ts |     100 |     92.3 |     100 |     100 | 26                
  templates.ts |     100 |     92.3 |     100 |     100 | 131               
  timeline.ts  |     100 |    94.44 |     100 |     100 | 40                
  types.ts     |       0 |        0 |       0 |       0 | (Interfaces only) 
  vendors.ts   |     100 |    95.83 |     100 |     100 |                   
---------------|---------|----------|---------|---------|-------------------
```

---

## 4. Key Unit Test Suites

### 4.1 Budget Domain (`tests/domain/budget.test.ts`)
- Exact integer addition ensuring $\sum \text{allocated} \equiv \text{totalBudget}$.
- 10% budget cuts preserving locked categories (e.g. Photography remains fixed, while Catering & Decor absorb the reduction).
- Zero float rounding error checks.
- Handling edge cases: 0 budget, 0 guests, locked categories exceeding target.

### 4.2 Timeline Domain (`tests/domain/timeline.test.ts`)
- Accurate days-remaining calculations (past, present, future).
- Urgency formatting (`Due today`, `Tomorrow`, `In 6 days`, `Overdue by 3d`, `Done`).
- Sorting by due date with completed items placed at the end.
- Milestone generation for different celebration types.

### 4.3 AI Layer (`tests/ai/*.test.ts`)
- **Security:** Rejection of prompt injections, DAN jailbreaks, instruction overrides.
- **Failover & Cooldown:** Simulation of model 429 rate-limiting, activating 60-second cooldown and invoking secondary models.
- **Cache:** TTL validation, oldest entry eviction, key normalization.
- **Deterministic Fallback:** Verification that every prompt can be answered accurately offline without an API key, labeled `source: 'built-in'`.

---

## 5. End-to-End & Accessibility Tests (Playwright)

Located in `tests/e2e/`:
- `celebration-planner.spec.ts`: Tests complete user journeys (overview viewing, tab switching, AI assistant dialogue, budget recalculation, template switching to birthday, multilingual cycling).
- `accessibility.spec.ts`: Automated axe-core auditing verifying zero WCAG AA violations across themes and reduced-motion states.
