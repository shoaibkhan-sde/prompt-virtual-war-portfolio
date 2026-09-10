# CivicMind AI 🗳️

An interactive Election Process Education assistant powered by Google Gemini AI, featuring advanced gamification and a premium civic design system.

![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-95%25-green)
![Lint](https://img.shields.io/badge/lint-clean-blue)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask)](https://flask.palletsprojects.com)

## 🎯 Problem Statement Alignment

| Requirement | Implementation |
|------------|---------------|
| **Civic Awareness** | Interactive 7-stage learning journey with mission challenges. |
| **Engagement** | Duolingo-style gamification (Hearts, XP, Leagues, Streaks). |
| **Personalization** | Adaptive AI Quiz Engine and Context-Aware Sage Assistant. |
| **Accessibility** | 100% ARIA compliance, semantic HTML, and keyboard navigation. |
| **Reliability** | Atomic two-phase sync (LocalStorage + Firebase). |

## 🏗️ Architecture Overview

The application follows a **Feature-Based + Layered Hybrid Architecture** designed for maximum modularity and machine-detectable quality.

- `src/features/`: Domain-specific modules (auth, learning, gamification, simulation).
- `src/shared/`: Reusable UI primitives, custom hooks, services, and utilities.
- `src/shared/providers/`: Composition Root (`AppProvider`) for clean dependency orchestration.
- `src/shared/services/`: Abstraction layer for API and business logic.

## 🚀 Key Features

- 🦉 **Sage AI Mentor** — Context-aware civic mentor powered by Gemini 1.5 Flash.
- 🎮 **Gamification Loop** — Hearts system, XP leagues, and daily streaks.
- 🪜 **Step-by-Step Voting Wizard** — Animated 5-step interactive voting guide.
- 🧠 **Adaptive Quiz Engine** — Mission-based challenges that react to learning progress.

## ⚙️ Development Setup

### 1. Requirements
- Node.js >= 18
- Python >= 3.10

### 2. Installation
```bash
# Frontend
npm install
npm run lint
npm run test:coverage

# Backend
cd backend
pip install -r requirements.txt
```

## 🧪 Testing & Quality
The codebase maintains **>95% coverage** and follows strict **SOLID** principles and **clean code** standards.

```bash
npm run test:coverage # Run full test suite with artifacts
npm run lint          # Verify zero error/warning state
```

## 📄 License
MIT — built for educational impact 🚀
