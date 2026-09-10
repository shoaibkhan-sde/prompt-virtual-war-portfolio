# Atmos — Personal Carbon Ledger & Action Platform

> **Understand, Track, and Reduce your carbon footprint through a premium ledger interface.**

Atmos reframes carbon tracking from an abstract environmental duty into a tangible financial metaphor. Rather than currency, the ledger is denominated in **kilograms of CO2 equivalent ($kg\ CO_2e$)**. Every daily activity represents a "debit" transaction against your carbon budget, while completed reduction tasks represent a positive offset credit.

---

## 🏛️ Problem Statement Alignment

Atmos addresses the core PromptWars Virtual Challenge 3 criteria across three fundamental pillars:

1. **UNDERSTAND**
   - Renders clear visual breakdowns of carbon expenses across categories (Transport, Energy, Food, Shopping, Waste).
   - Translates abstract metrics into concrete comparisons (e.g., the number of trees required to absorb the emissions, or driving distances in a gasoline vehicle).
   - Generates plain-language comparative bars measuring user averages against Paris-aligned targets (~2.3 tons/year), global averages (~4.7 tons), and national levels.
   - Provides accessible text lists/tables side-by-side with visual charts for screen reader compatibility.

2. **TRACK**
   - Features a quick-add transaction ledger for instant entries (e.g., Petrol Commute, Vegan Day).
   - Provides a custom logging form with type selection, note entry, and data validation.
   - Computes daily streaks to incentivize consecutive daily ledger reviews.
   - Supports paginated, searchable, editable, and deletable history logs.

3. **REDUCE**
   - Integrated with **Atmos Coach** — a Gemini-powered personal advisor.
   - Generates automated data-driven insights pointing to the user's largest single carbon driver.
   - Suggests a ranked list of 3-5 high-impact, actionable tasks with calculated weekly $kg\ CO_2e$ savings.
   - Features an interactive checklist of habits that dynamically updates dashboard calculations.

### PromptWars Virtual Challenge 3 — Criteria Mapping

| Pillar | Requirement | Implementation / Location |
|---|---|---|
| **Understand** | Visual breakdown of carbon expenses | `Dashboard.tsx` (Recharts Pie/Bar components) |
| **Understand** | Concrete comparisons | `Dashboard.tsx` (Trees to absorb, km driven equivalencies) |
| **Understand** | Paris Agreement & global benchmarks | `Dashboard.tsx` (Comparison Panel) |
| **Track** | Quick logging mechanism | `QuickAddPanel.tsx` (1-click debits) |
| **Track** | Detailed custom logging | `ActivityForm.tsx` (Date, Category, Type, Qty) |
| **Track** | Daily streak gamification | `useAppState.ts` (calculateStreak) & `Dashboard.tsx` (Badge) |
| **Reduce** | Data-driven AI insights | `gemini.service.ts` & `AtmosCoach.tsx` |
| **Reduce** | 3-5 actionable tasks w/ savings | `gemini.service.ts` (JSON schema constraint) |
| **Reduce** | Interactive checklist of habits | `ActionsList.tsx` (Adopt Action flow) |

---

## 📊 CO₂e Methodology & Calculations

Atmos calculates carbon ledger debits and savings using Carbon Dioxide Equivalent ($\text{CO}_2\text{e}$) metrics. This methodology consolidates the warming potential of various greenhouse gases (such as carbon dioxide, methane, and nitrous oxide) into a single index representing the mass of $\text{CO}_2$ that would cause equivalent warming over a 100-year timescale.

### 1. Emission Factor Data Sources
Our calculation formulas and factors are based on canonical public emissions databases:
* **IPCC (Intergovernmental Panel on Climate Change)**: Guidelines for national greenhouse gas inventories.
* **DEFRA (UK Department for Environment, Food & Rural Affairs)**: Carbon factor database for transport, materials, and waste.
* **EPA (US Environmental Protection Agency)**: eGRID coefficients for regional electricity grid intensity factors, plus greenhouse gas equivalencies.

### 2. Emission Source Categories
* **Transport**: Calculates transit emissions by multiplying travel distance by vehicle intensity factors (e.g., Petrol Car: $0.18\text{ kg CO}_2\text{e/km}$, Train: $0.03\text{ kg CO}_2\text{e/km}$).
* **Energy**: Measures home utility footprints. Grid electricity factor changes based on region (US: $0.38\text{ kg CO}_2\text{e/kWh}$, IN: $0.82\text{ kg CO}_2\text{e/kWh}$ due to high coal dependence). Heating fuels are measured by volume (e.g., Heating Oil: $2.7\text{ kg CO}_2\text{e/L}$).
* **Food**: Diet-based carbon intensity estimates (e.g., Vegan: $1,500\text{ kg CO}_2\text{e/yr}$, Meat-heavy: $3,300\text{ kg CO}_2\text{e/yr}$) mapped to daily ledger debits.
* **Shopping & Waste**: Evaluates disposal patterns (Landfill: $0.50\text{ kg CO}_2\text{e/kg}$ vs. Composting: $0.05\text{ kg CO}_2\text{e/kg}$).

### 3. Sustainability Score & Goal Calculations
* **Baseline Calculation**: Onboarding survey responses are used to estimate the user's initial annual carbon footprint.
* **Daily Carbon Budget**: Calculated dynamically by dividing the onboarding annual footprint by 365. The daily budget is capped to a maximum of $25.0\text{ kg CO}_2\text{e/day}$ and a minimum floor of $6.3\text{ kg CO}_2\text{e/day}$ (Paris Agreement alignment).
* **Sustainability Score**: An index computed dynamically based on the percentage of days in the current cycle where the user stayed within their budget limit.

### 4. AI-Powered Optimization (Google Gemini)
* **Atmos Coach** evaluates the historical activity ledger, matches user behavior against their target reduction goals, and uses Gemini to recommend ranked carbon-saving actions with estimated weekly $\text{CO}_2\text{e}$ savings.

---

## 🛠️ Technology Stack

Atmos is engineered as a unified monorepo:

* **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS, Recharts (lazy-loaded), and Framer Motion.
* **Backend**: Node.js, Express, Helmet, CORS, Express-Rate-Limit, and `@google/generative-ai`.
* **Persistence**: Lightweight JSON-file database (`server/data/db.json`) that safely persists profile details, activities, and goals across restarts without binary compile dependencies.

---

## 🚀 Setup & Execution Instructions

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### 1. Environment Configuration
Create a `.env` file in the project root based on the provided template:
```bash
cp .env.example .env
```
Open `.env` and fill in your Gemini API key:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If no API key is specified, the application automatically degrades to a local rule-based advisory engine, ensuring 100% functionality).*

### 2. Development Mode
To run both the Vite frontend dev server (port 3000) and the Express backend (port 5000) concurrently:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. All frontend requests to `/api/*` are automatically proxied to the Express backend.

### 3. Production Build & Deployment
Atmos is configured for single-service deployments (e.g. Render, Railway, or VPS). The Express server serves the built frontend statically from the same port.

Compile and build the Vite assets:
```bash
npm run build
```
This builds the static bundle into `dist/`.

Run the production server:
```bash
npm run start
```
Open `http://localhost:5000` to access the full application running on a single URL.

---

## 🧠 Atmos Coach: AI Architecture & Caching

To ensure premium efficiency, security, and resiliency:

* **API Proxying**: The client never directly calls Google's servers. All requests go through the backend Express proxy to protect the `GEMINI_API_KEY`.
* **In-Memory Caching**: AI calls are heavy and costly. Atmos caches insights on the server, keyed by a SHA-256 state hash of the user's profile and current activities. If the ledger state has not changed, reloading the dashboard retrieves the insights instantly from memory, avoiding redundant API calls.
* **Rate Limiting**: AI endpoints are rate-limited to 30 requests per 15 minutes per IP to prevent spam and cost runaways.
* **XSS Protection**: AI responses are treated as untrusted. Front-end renderings pass through a custom sanitization formatter that strips raw tags, escapes brackets, and converts basic bold/bullet markdown syntaxes safely without using dangerous HTML injections.

---

## ♿ Accessibility & Visual Identity

* **Ledger Aesthetics**: Designed with a dark-mode-first aesthetic (`#0B0F0E` background) resembling modern financial platforms. Tabular fonts (`JetBrains Mono`) are used for numbers to align values cleanly.
* **Contrast & Color-Coding**: The budget gauge shifts colors (Teal $\rightarrow$ Amber $\rightarrow$ Red) as emissions rise. To comply with WCAG AA guidelines, the gauge is accompanied by textual badges ("Within Budget Limit", "Carbon Budget Debited") so colorblind users receive the same data.
* **Screen Reader Adaptations**: Visual charts can be toggled to data tables at the click of a button, ensuring screen readers can navigate and read the information natively. All forms utilize explicit `<label>` tags.
* **Keyboard Navigable**: Every interactable component has clear focus outlines and can be reached using Tab and Arrow keys.
* **Prefers Reduced Motion**: Transitions and pulse effects respect system accessibility settings.

---

## 🧪 Testing

We use **Vitest** + **React Testing Library** for test execution.

Run the test suite:
```bash
npm run test
```

### Coverage Scope
- **Unit Tests**: Coverage for pure emission math factors (car, diets, waste, electricity intensities) and onboarding calculations.
- **Component Tests**: Validations of custom activity log form inputs and form fields.
- **Mocking**: All Gemini API integrations are fully mocked; tests run with zero network overhead.
