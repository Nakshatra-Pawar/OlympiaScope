# OlympiaScope

OlympiaScope is an interactive Olympic analytics explorer built as a course project for **DSCI 551 – Database Systems**.

The project is split into two parts:

- **Backend** – a CSV–backed mini SQL engine written in pure Python and exposed via a FastAPI service.
- **Frontend** – a Next.js app that lets users explore medals, athletes, countries and efficiency metrics through a clean UI.

---

## Features

- **Athlete search**
  - Filter by name, season, year range, NOC and sport.
  - Toggle between “all athletes” and “medal winners only”.
  - Server-side pagination using a streaming CSV scan.

- **Medal leaderboard**
  - Global medal table across all Olympics.
  - Optional `year` filter and `top N` limit.
  - Joins event results with country metadata.

- **Medal efficiency analytics**
  - Medals per million people.
  - Medals per billion GDP.
  - Sort and limit top N countries for a given year / season / medal type.

- **Join demo**
  - Simple endpoint that demonstrates joining the events and countries datasets using the custom engine.

- **Lightweight SQL-like engine**
  - CSV parser with type inference and chunked reading.
  - Relational-style operators: `filter`, `project`, `join`, `group by + aggregates`, `order by`, `head`, etc.
  - Streaming `group_by` and `order_by` helpers for large CSV files.

---

## Tech Stack

**Backend**

- Python 3.10+
- FastAPI
- Uvicorn
- Custom CSV engine (no Pandas or external DB)

**Frontend**

- Next.js (App Router)
- TypeScript + React
- Tailwind CSS
- Client-side routing and hooks for API calls

---

## Folder Structure

```text
OLYMPIASCOPE/
├── backend/
│   ├── main.py                 # FastAPI app + API endpoints
│   ├── my_sql_engine.py        # Custom CSV / SQL-like engine
│   ├── events.csv
│   ├── countries.csv
│   ├── noc_to_countrycode.csv
│   ├── country_year_stats.csv
│   └── requirements.txt
└── frontend/
    ├── public/                 # Static assets (icons, hero image, etc.)
    ├── src/
    │   ├── app/                # Next.js app router pages
    │   ├── components/         # Reusable UI components
    │   ├── context/            # React context for shared state
    │   └── lib/                # API helpers, types and utilities
    ├── FRONTEND_DOCUMENTATION.md
    ├── package.json
    └── README.md               # Default Next.js readme (can be replaced)
```

---

## Getting Started

### Prerequisites

- Python 3.10+  
- Node.js 20+ (recommended)  
- npm or yarn  
- Git (if you are cloning from GitHub)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

---

## Backend Setup (FastAPI + CSV Engine)

```bash
cd backend
python -m venv venv       # optional but recommended
source venv/bin/activate  # on macOS / Linux
# venv\Scripts\activate # on Windows

pip install -r requirements.txt
```

### Run the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- Base URL: `http://localhost:8000`
- Docs (Swagger UI): `http://localhost:8000/docs`

---

## Frontend Setup (Next.js)

In a new terminal:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` folder:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Run the frontend

```bash
npm run dev
```

Then open the app at: `http://localhost:3000`.

---

## Key API Endpoints

All endpoints are prefixed with `/api`.

- `GET /api/health` – simple health check.
- `GET /api/preview/events` – small sample of event rows.
- `GET /api/preview/countries` – small sample of country rows.
- `GET /api/athletes/search` – athlete search with filters and pagination.
- `GET /api/sports` – list of available sports from the events dataset.
- `GET /api/leaderboard` – medal leaderboard (optionally filtered by year).
- `GET /api/efficiency` – medal efficiency metrics for a given year.
- `GET /api/join-demo` – demo of a join between events and countries.

For more frontend-specific details (components, routing, and UI design), see `frontend/FRONTEND_DOCUMENTATION.md`.

---

## Development Notes

- The backend is purposely **file-based** to highlight database concepts such as streaming, late materialization and custom group-by / join logic.
- Frontend calls the FastAPI service through `NEXT_PUBLIC_API_URL`, so the URL can be changed easily for deployment.
- Node modules, build artifacts, virtual environments and caches should be ignored using `.gitignore` in the repository.

---

## License

This project was created for educational purposes. Feel free to reuse ideas or code snippets with attribution.
