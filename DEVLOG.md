# Developer Log — Atmos Carbon Ledger

A chronicle of key engineering decisions, constraints, and implementations during the development of Atmos.

---

### Entry 1: Monorepo Setup & Unified Package Strategy
**Date: 2026-06-12**  
* **Decision**: Architected the codebase as a single-package monorepo where the root `package.json` contains dependencies for both Vite/React frontend and Express backend.
* **Rationale**: This eliminates duplicate `node_modules` folders, keeping the source repository small (well below the 10MB limit). Developers can launch the entire stack using a single `npm run dev` script powered by `concurrently`.
* **Outcome**: Clean repository layout. In production, we build the client directly into the server's public distribution folder, making deployment single-service friendly (perfect for Render or Railway).

---

### Entry 2: Formulating the Emissions Factor Calculation Engine
**Date: 2026-06-12**  
* **Decision**: Engineered `src/lib/emissionFactors.ts` as a library of pure mathematical functions, referencing official datasets from DEFRA, EPA, and GHGP.
* **Rationale**: Separation of concerns. By making calculations pure functions (input $\rightarrow$ output with no side effects or DOM/API dependencies), we can trivially unit test the engine across categories and edge cases (such as zero/negative inputs).
* **Outcome**: A solid carbon math foundation. The onboarding script estimates annual footprints and daily budgets dynamically based on regional grid carbon intensities.

---

### Entry 3: Securing the AI Advisory and Gemini Proxy Integration
**Date: 2026-06-12**  
* **Decision**: Excluded front-end Gemini calls. All chat and insights requests are directed to the Express backend, which serves as a secure API proxy.
* **Rationale**: Exposing a `GEMINI_API_KEY` on the client is a severe security vulnerability. The proxy loads keys via environment variables, implements basic rate-limiting (30 reqs / 15 mins) to prevent resource depletion, and performs strict server-side schema validations on inputs.
* **Outcome**: Secure, rate-limited AI queries. Added a custom text formatter in `AtmosCoach.tsx` that escapes brackets and HTML elements to prevent cross-site scripting (XSS) when rendering AI text outputs.

---

### Entry 4: Optimizing Bundle Efficiency and AI Cache Layers
**Date: 2026-06-12**  
* **Decision**: Implemented lazy-loading for heavy UI components (Recharts graphs and AtmosCoach panel) using `React.lazy()` and `Suspense`. Added an in-memory caching layer on the backend API.
* **Rationale**: Heavy libraries like Recharts increase initial bundle size. Caching AI responses prevents redundant Gemini API calls on dashboard page refreshes. The cache key is a SHA-256 hash of the user's current activities and profile. If the ledger transaction state is unchanged, the server returns cached insights instantly.
* **Outcome**: Improved initial page speeds and zero redundant Gemini API billing. 

---

### Entry 5: Dual Persistence & Rule-Based Fallback Engine
**Date: 2026-06-12**  
* **Decision**: Designed the backend with a local JSON file database and wrote a comprehensive client-side fallback persistence to `localStorage`. Added a rule-based advisor inside `src/lib/localInsights.ts`.
* **Rationale**: Resiliency during offline evaluation. If the Express backend is not running or network requests fail, the client detects the connection lapse, switches to "Offline Mode", persists data locally, and shifts the AI Coach to rule-based data suggestions.
* **Outcome**: Highly resilient, fail-safe application that works seamlessly regardless of API key availability or server status.

---

### Entry 6: Implementing WCAG AA Accessibility Standards
**Date: 2026-06-12**  
* **Decision**: Enhanced the dashboard visual elements to support screen readers and color-blind users.
* **Rationale**: Standard circular progress bars that color-shift blue $\rightarrow$ amber $\rightarrow$ red rely entirely on visual cues. To make Atmos accessible, we paired the gauge with explicit text badges. Toggling to a semantic "Table View" allows screen-reader users to access historical data directly.
* **Outcome**: Fully compliant keyboard-navigable interface. All input forms utilize associated `<label>` tags rather than placeholders.
