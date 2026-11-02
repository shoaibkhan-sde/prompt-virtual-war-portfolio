# Contributing to Jashn

Thank you for your interest in contributing to **Jashn**! We welcome contributions to make event and celebration planning more accessible, reliable, and delightful for everyone.

---

## Code of Conduct

Please be respectful, collaborative, and inclusive. We strive to maintain a welcoming community for all developers and event planners.

---

## Architectural Principles

Before contributing code, please review our core architectural invariants:

1. **Hexagonal Domain Isolation:** Pure domain mathematics (budget splits, timeline compression, vendor checklists, and readiness scores) live inside `src/domain/` with zero external dependencies and zero UI imports.
2. **Mathematical Invariant:** Budgets must always add up exactly to the total budget using the **Hare-Niemeyer largest-remainder method**. Never allow rounding errors or floating-point drift.
3. **Defense-in-Depth Security:** Every API route enforces payload size limits (50KB max) and sliding-window rate limiting. Prompt injection guardrails sanitize all user input before passing it to AI models.
4. **Universal Accessibility (WCAG 2.1 AA):** All interactive elements require semantic HTML, explicit keyboard focus states (`focus-visible:ring-2`), ARIA labels, and minimum 4.5:1 color contrast ratios in both light and dark modes.

---

## Development Workflow

### 1. Prerequisites
- Node.js >= 18.18.0
- npm >= 9.0.0

### 2. Setup
```bash
git clone https://github.com/shoaibkhan-sde/Jashn.git
cd Jashn
npm install
```

### 3. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Running Quality Checks
Before submitting a pull request, ensure all checks pass:

```bash
# Typecheck
npx tsc --noEmit

# Linting
npm run lint

# Unit & Domain Tests
npm run test

# End-to-End Tests
npm run test:e2e
```

---

## Coding Standards

- **TypeScript:** Strict mode is enforced. Avoid `any` types; define explicit interfaces or schemas with Zod.
- **JSDoc:** Add clear JSDoc comments (`@param`, `@returns`, `@description`) to all exported domain functions and utilities.
- **Styling:** Use Tailwind CSS utility classes and predefined design tokens from `tailwind.config.ts`.
- **Git Commit Convention:** Follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add WhatsApp summary share action`
  - `fix: correct leap-year schedule scaling in timeline-math`
  - `docs: update ARCHITECTURE.md with sequence diagram`
  - `test: add unit tests for contingency recalculation`

---

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with clear messages.
3. Push to your fork and submit a Pull Request against `main`.
4. Ensure all CI checks pass.

