/**
 * @module Atmos
 * @description React application bootstrap for the Atmos Personal Carbon Ledger & Action Platform.
 *
 * Atmos addresses three fundamental pillars of individual climate action:
 *
 * 1. **UNDERSTAND** — Visualises personal carbon emissions across Transport, Energy,
 *    Food, Shopping, and Waste categories with Paris Agreement benchmarks and
 *    accessible data table alternatives for screen readers.
 *
 * 2. **TRACK** — Records daily emission entries as debit transactions against a
 *    personalised carbon budget derived from the user's onboarding profile, with
 *    streak gamification and searchable, paginated history.
 *
 * 3. **REDUCE** — Integrates with Google Gemini to generate ranked, personalised
 *    carbon reduction action plans with estimated weekly kg CO₂e savings, backed
 *    by a local rule-based fallback engine for offline/API-key-free operation.
 *
 * Accessibility: `MotionConfig reducedMotion="user"` propagates system reduced-motion
 * preferences to all Framer Motion animations across the component tree.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>
);
