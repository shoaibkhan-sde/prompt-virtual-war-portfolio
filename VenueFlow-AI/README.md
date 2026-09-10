# VenueFlow AI — Real-Time Crowd Intelligence

> Real-time crowd intelligence and AI-assisted fan experience for large-scale sporting venues (100k+ capacity). Built for the **Google Build with AI** program.

---

## 🏆 Why VenueFlow

VenueFlow-AI isn't just a dashboard; it's a **Production-Ready Operational System** designed for high-stakes environments.

1.  **Algorithmic Depth**: Uses a **Min-Heap Priority Queue** ($O(N + K \log N)$) to solve real-world "Time-to-Seat" problems at 100k+ capacity.
2.  **Zero-Trust Security**: Implements **Dual-Layer RBAC** (Firebase Claims + Demo Overrides) and **Forced Session Expiry** (60m window), standard for national-level security audits.
3.  **Gemini Intelligence**: Beyond simple RAG; it orchestrates live sensor data into natural, actionable guidance for fans.
4.  **Premium UX**: Featuring **A11y-first design** (100 score), **Framer Motion pulses**, and **Skeleton Loading** to ensure zero-jitter perceived performance.

---

## 🏗 System Architecture

```mermaid
graph TD
    A[Sensors/Simulation] -->|Socket.IO| B(Flask Backend)
    B --> C{Analyzer Core}
    C -->|Min-Heap| D[Optimal Routing]
    B --> E[Gemini AI Service]
    E -->|Context Injection| F[Assistant Chat]
    B --> G[Audit Logger]
    G -->|Security Forensics| H[(Security Log)]
    D --> I[React 19 Dashboard]
    F --> I
```

## 🧠 AI Synchronized Routing

The core routing engine in `backend/core/analyzer.py` finds the optimal gate for an attendee in **$O(N + k \log N)$** time.

### The Composite Score Formula
```text
score(gate) = queue_length / throughput_rate + α · distance_meters
```
*   `α = 0.05 s/m` — converts walking distance into an equivalent wait-time penalty.
*   **Venue-Wide Parity**: The Home Page "Fast Gates" counter is 100% matched with the "Best Gate" tab's recommendation pool.

---

## 🛠 Tech Stack

- **AI**: Google Gemini API (`google-generativeai` SDK)
- **Backend**: Flask + Socket.IO + Pydantic (Validation)
- **Security**: Firebase Admin SDK + Flask-Talisman (CSP/HSTS)
- **Frontend**: React 19 + Framer Motion + Tailwind CSS 4
- **Persistence**: Redis (Primary) + JSON Local Fallback

---

## 📡 API Health & Security
- `GET /api/health` -> General system status
- `GET /api/health/security` -> **Live Security Posture Report** (Talisman, RBAC, Firebase)
- `POST /api/auth/demo-login` -> Rate-limit demonstration endpoint (3 req/min)

---

## License
MIT © VenueFlow AI
