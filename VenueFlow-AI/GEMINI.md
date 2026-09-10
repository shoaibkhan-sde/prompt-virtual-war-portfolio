# VenueFlow-AI: GEMINI Instructions

## Project Overview

**VenueFlow-AI** is a project dedicated to enhancing the physical event experience for attendees at large-scale sporting venues. The primary focus is on solving common challenges such as:

*   **Crowd Movement:** Optimizing flow to prevent congestion using a Min-Heap priority queue algorithm.
*   **Waiting Times:** Reducing queues for concessions, restrooms, and entry/exit points via real-time load-balancing.
*   **Real-time Coordination:** Providing timely information and updates through a Gemini-powered AI assistant.

The ultimate goal is to create a seamless and enjoyable experience for everyone at the venue.

## Tech Stack

- **Language:** Python 3.10+ / JavaScript (ES2022)
- **Backend Framework:** Flask
- **AI Integration:** Google Gemini API (`google-generativeai` SDK)
- **Frontend Framework:** React 19 (Vite 8)
- **CSS Framework:** Tailwind CSS 4
- **Algorithm:** Min-Heap / Priority Queue for crowd routing
- **Testing:** Manual + Simulation

## Directory Overview

- **backend/**: Python Flask API server
  - **api/**: Flask Blueprints (routes_crowd, routes_chat, routes_gates)
  - **services/**: External integrations (Gemini AI, Maps/distance)
  - **core/**: Domain models + crowd-routing algorithms (analyzer.py)
  - **simulation/**: Synthetic sensor data generator
  - **config.py**: Environment variable configuration
  - **app.py**: Flask app factory
- **frontend/**: React + Vite + Tailwind CSS dashboard
  - **src/hooks/**: Custom polling hooks (useWaitTimes, useCrowdData)
  - **src/components/**: Dashboard, CrowdHeatmap, GateStatus, AssistantChat
- **README.md**: Setup instructions and Big-O analysis
- **GEMINI.md**: (This file) AI development context

## Usage

### Running the Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
python -m backend.app
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running the Simulation

```bash
python -m backend.simulation.sensor_generator
```

## Development Status (TODO)

*   [x] Define the core technology stack (Flask + React).
*   [x] Create a repository structure (Service-Repository pattern).
*   [x] Implement Min-Heap fastest-path algorithm in `core/analyzer.py`.
*   [x] Integrate Gemini API for fan-facing assistant.
*   [x] Build React dashboard with Tailwind CSS.
*   [x] Create crowd simulation data generator.
*   [x] Write README with Big-O analysis.
*   [ ] Establish build and deployment pipelines.
*   [ ] Connect to real sensor data / MQTT broker.
*   [ ] Add user authentication.
*   [ ] Implement database persistence (PostgreSQL).
