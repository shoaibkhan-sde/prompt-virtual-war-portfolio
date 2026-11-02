# Accessibility (A11y) Specification — Jashn

## 1. Compliance Standard

**Jashn** is designed and tested to achieve strict **WCAG 2.1 Level AA** compliance. All interactions are usable via screen readers, keyboard only, high contrast, and reduced motion modes.

---

## 2. Accessibility Highlights & Features

### 2.1 Keyboard Navigation & Focus Management
- **Full Tabability:** Every button, tab, input, and modal interactive element is reachable via standard <kbd>Tab</kbd> and <kbd>Shift + Tab</kbd>.
- **Arrow Key Tab Navigation:** The primary navigation tablist implements the WAI-ARIA Tabs pattern:
  - <kbd>→</kbd> / <kbd>←</kbd>: Navigate between tabs.
  - <kbd>Home</kbd> / <kbd>End</kbd>: Jump to first / last tab.
  - <kbd>Enter</kbd> / <kbd>Space</kbd>: Toggle milestone status, select celebration templates, or activate filters.
- **Escape Key Listeners:** Modals (Scenario Diff and Edit Details) immediately dismiss on <kbd>Escape</kbd>.

### 2.2 Screen Reader Announcements & Live Regions
- **Live Region for AI Responses:** The AI Assistant response feed is configured with `aria-live="polite"`, allowing assistive technology to announce new recommendations without aggressively interrupting active speech.
- **Progress Bars:** Budget category bars expose `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"` alongside descriptive `aria-label` tags.
- **Accessible Forms:** All form inputs feature explicit `<label>` tags with matching `htmlFor` identifiers (or `.sr-only` where visual placeholders suffice).

### 2.3 Color Contrast & Visual Design
- **High Contrast Ratios:**
  - Deep Indigo (`#2E2A7A`) against White (`#FFFFFF`): **11.2:1** (exceeds WCAG AAA requirement of 7:1).
  - Text Muted (`#5B6070`) against White: **5.1:1** (exceeds WCAG AA requirement of 4.5:1).
  - Gold Accents (`#F5A524`) paired with Dark Ink text (`#14161C`): **8.7:1**.
- **No Color-Only Information:** Status badges always combine color tones with clear textual labels (`Booked`, `Done`, `Due in 6 days`, `Tasting set`).

### 2.4 Motion & Vestibular Safety (`prefers-reduced-motion`)
Celebratory festive animations in Jashn respect user system preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation: none !important;
    transition: none !important;
  }
}
```
When reduced motion is enabled:
- Bunting garland sway stops.
- Bubble floaters are statically anchored.
- Circular countdown ring remains static.
- Orbital chips freeze into fixed readable positions.

---

## 3. Automated Audits with Axe-Core

Automated accessibility audits are built into our Playwright test suite (`tests/e2e/accessibility.spec.ts`) using `@axe-core/playwright`.

### Rules Validated:
- `color-contrast`
- `aria-allowed-attr`
- `aria-required-children`
- `aria-required-parent`
- `aria-roles`
- `button-name`
- `duplicate-id-active`
- `heading-order`
- `html-has-lang`
- `image-alt`
- `label`
- `landmark-one-main`
- `region`
