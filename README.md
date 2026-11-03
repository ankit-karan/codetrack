# CodeTrack — DSA Progress & Intelligence Platform

A full-stack MERN application for tracking Data Structures & Algorithms practice:
log every question you solve, get real analytics on topics and difficulty mix,
plan spaced-repetition revisions, and protect daily/weekly goals and streaks.

Every number on every screen is computed from **your own database records** —
there are no hardcoded stats and no fake backend responses.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Folder structure](#folder-structure)
- [Run locally](#run-locally)
- [Database setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [Demo data](#demo-data)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Known limitations / remaining work](#known-limitations--remaining-work)

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, Vite, Tailwind CSS v4, React Router v7, Axios, Recharts, Lucide icons |
| Backend   | Node.js, Express 4, JWT auth, bcryptjs, express-validator, Helmet, Morgan |
| Database  | MongoDB Atlas (Mongoose ODM) |
| Testing   | Jest + Supertest + mongodb-memory-server (backend), Vitest + React Testing Library (frontend) |
| Deploy    | Vercel (frontend) + Render (backend) |

---

## Features

**Auth** — register / login / logout with JWT, protected routes, per-user data
ownership (every query is scoped to the authenticated user; cross-user access
returns 404).

**Dashboard** — KPI cards (total/solved/attempted/unsolved, easy/medium/hard),
coding streak, daily & weekly goal progress, difficulty & status donut charts,
7-day and 30-day activity charts, topic-wise progress bars, weak-topic alerts and
overdue-revision reminders.

**Question manager** — full CRUD with title, platform, URL, topic, difficulty,
status, time/space complexity, notes, language and dates. Filter by
topic / difficulty / status / platform, sort, full-text title search,
server-side pagination, inline status toggle, "schedule revision" shortcut,
table or card layout, and empty states for both zero-data and zero-match cases.

**Topic analytics** — all 18 fixed DSA topics with per-topic completion rates,
difficulty breakdowns, aggregate mastery stats and automatic weak-topic
detection (3+ questions but under 50% solved).

**Revision planner** — spaced-repetition queue (Due / Overdue / Completed tabs)
built from your own solve history: mark done, snooze +3 days, delete.

**Goals & streaks** — daily (1–50) and weekly (1–350) targets with a goal period,
live progress bars, current/longest streak computed from real `solvedAt` dates
(UTC day buckets), and a 16-week practice contribution calendar.

**Profile** — name, daily target, LeetCode / GeeksforGeeks profile URLs,
password change, account stats and settings. Profile URLs are **manually pasted
reference links** — CodeTrack does **not** automatically sync with any external
platform; all analytics come solely from the questions you log.

---

## Folder structure

```
codetrack/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/         # Donut, TopicBar, Activity (Recharts)
│   │   │   ├── goals/          # PracticeCalendar
│   │   │   ├── layout/         # Sidebar, Topbar, DashboardLayout
│   │   │   ├── problems/       # Table, Filters, FormModal, DetailsModal
│   │   │   ├── ui/             # Button, Card, Modal, Input, Badge, …
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/            # Auth, Theme, Toast providers
│   │   ├── hooks/              # useAsync, useDebounce, useDocumentTitle
│   │   ├── pages/              # Login, Register, Dashboard, Questions,
│   │   │                       # Topics, Revisions, Goals, Profile, NotFound
│   │   ├── services/           # api (axios + interceptors) + per-domain services
│   │   ├── test/               # Vitest setup + test files
│   │   └── utils/              # constants, formatters
│   ├── .env.example
│   ├── vercel.json              # SPA rewrites (must live in the Root Directory)
│   └── vite.config.js          # dev proxy /api → :5000, vitest config
├── server/                     # Express REST API
│   ├── scripts/seedDemo.js     # demo account seeder
│   └── src/
│       ├── app.js              # middleware, routes, error handling
│       ├── server.js           # entrypoint (connects DB, starts listener)
│       ├── config/db.js        # Atlas connection with retry
│       ├── controllers/        # auth, problem, analytics, revision, goal, profile
│       ├── middleware/         # auth (JWT protect), rules, validate, errorHandler
│       ├── models/             # User, Problem, Revision, Goal (Mongoose)
│       ├── routes/             # one router per domain
│       ├── tests/              # Jest + Supertest suites (mongodb-memory-server)
│       └── utils/              # ApiError, asyncHandler, response, dates, constants
├── .env.example                # points at server/.env.example
├── .gitignore
├── render.yaml                 # Render blueprint (backend)
└── README.md                   # this file
```

---

## Run locally

Prerequisites: **Node.js ≥ 18**, **npm**, a **MongoDB Atlas** cluster (or any
MongoDB URI).

```bash
# 1. Clone and install
git clone <your-repo-url>
cd codetrack/server && npm install
cd ../client && npm install

# 2. Configure the backend
cd ../server
cp .env.example .env
# Edit .env → set MONGODB_URI and JWT_SECRET (see below)

# 3. Start both (in two terminals)
cd server && npm run dev     # API on http://localhost:5000
cd client && npm run dev     # UI  on http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS
setup is needed locally. Open **http://localhost:5173** and register an account.

---

## Database setup (MongoDB Atlas)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database → Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/codetrack?retryWrites=true&w=majority`.
3. **Database Access** → create a user with *Read and write to any database*.
4. **Network Access** → allow your IP (`0.0.0.0/0` if the backend runs on Render).
5. Paste the URI into `server/.env` as `MONGODB_URI`.
6. (Optional) seed demo data:

```bash
cd server
npm run seed:demo
# login → demo@codetrack.dev / demo1234
```

> The Atlas username/password are **manual configuration** — they live only in
> your local `server/.env` (and Render's dashboard), which are git-ignored.

---

## Environment variables

**`server/.env`** (from `server/.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random secret used to sign JWTs (server refuses to start without it) |
| `JWT_EXPIRES_IN` | – | Token lifetime, default `7d` |
| `PORT` | – | API port, default `5000` |
| `CLIENT_URL` | – | Comma-separated allowed origins, default `http://localhost:5173` |
| `NODE_ENV` | – | `development` \| `production` \| `test` |

**`client/.env`** (from `client/.env.example`):

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL. Unset in dev (Vite proxy); set `https://<backend>/api` in production |
| `VITE_PROXY_TARGET` | Dev-proxy target, default `http://localhost:5000` |

---

## Testing

```bash
# Backend — 62 tests (Jest + Supertest + mongodb-memory-server)
cd server && npm test

# Frontend — 20 tests (Vitest + React Testing Library)
cd client && npm test

# Lint (strict react-hooks v7 / React Compiler rules)
cd client && npm run lint

# Production build
cd client && npm run build
```

**Latest results**

| Suite | Result |
|-------|--------|
| `server` Jest | ✅ 6/6 suites, **62/62 tests** |
| `client` Vitest | ✅ 2/2 files, **20/20 tests** |
| `client` ESLint | ✅ 0 errors, 0 warnings |
| `client` `vite build` | ✅ builds with route-level code splitting |

Backend coverage per module: auth (register/login/me, validation, duplicate
email, bad password, missing token), problems (CRUD + ownership 404s,
pagination, every filter, title search), analytics (totals sum invariants,
streaks, topics, activity series), revisions + goals (CRUD, ownership,
progress math), profile (update, password change), and pure date/streak utils.

---

## Deployment

### Backend → Render

1. Push the repo to GitHub.
2. Render → **New → Blueprint** → select the repo (uses `render.yaml`).
3. Set the environment variables it prompts for:
   - `MONGODB_URI` — your Atlas URI
   - `JWT_SECRET` — generated automatically by the blueprint
   - `CLIENT_URL` — your Vercel frontend URL, e.g. `https://<app>.vercel.app`
4. Render installs `server/` dependencies, runs `npm start`, and health-checks
   `/api/health`.

### Frontend → Vercel

1. Vercel → **New Project** → import the repo.
2. Set **Root Directory** = `client`, framework = **Vite**, build = `npm run build`,
   output = `dist`.
3. Add the environment variable:
   `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`
4. Deploy. `client/vercel.json` provides the SPA fallback rewrite so deep
   links work on refresh. No API proxy is needed: the app calls the Render
   backend directly via `VITE_API_URL`.
5. After both are live, update `CLIENT_URL` on Render to the final Vercel domain
   (CORS is origin-checked).

---

## API reference

Base URL: `/api` · All protected routes require `Authorization: Bearer <jwt>` ·
Responses are enveloped: success `{ success: true, data }`, error
`{ success: false, message, errors: [{ field, message }] }`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create account, returns JWT + user |
| POST | `/auth/login` | Sign in, returns JWT + user |
| GET | `/auth/me` | Current user |
| GET | `/problems` | List (params: `page, limit, search, topic, difficulty, status, platform, sort`) |
| POST | `/problems` | Create question |
| GET | `/problems/:id` | Read one (owner only) |
| PATCH | `/problems/:id` | Update (owner only) |
| PATCH | `/problems/:id/status` | Toggle status |
| DELETE | `/problems/:id` | Delete + cascade revisions (owner only) |
| GET | `/analytics/overview` | Totals, streak, activity, revision counts |
| GET | `/analytics/topics` | 18-topic mastery + weak topics |
| GET | `/analytics/difficulty` | Per-difficulty completion |
| GET | `/analytics/activity?days=N` | Daily solved series |
| GET | `/revisions?status=pending\|overdue\|completed\|all` | Revision queue + counts |
| POST | `/revisions` | Schedule `{ problemId, revisionDate }` |
| PATCH | `/revisions/:id` | Complete / reschedule |
| DELETE | `/revisions/:id` | Remove |
| GET | `/goals` | Active goal + live progress |
| POST | `/goals` | Create goal (deactivates previous) |
| PATCH | `/goals/:id` | Update goal |
| GET`/`PATCH | `/profile` | Profile + stats / update profile & password |
| GET | `/health` | Liveness probe |

---

## Known limitations / remaining work

- **No automatic platform sync** — LeetCode/GfG URLs are reference links you
  paste yourself (by design; stated in the UI and README).
- Revisions are scheduled manually (one-click "+1 day" from the question table)
  rather than auto-generated from solve dates.
- No email verification / password reset flows — credentials are username +
  password only.
- Practice calendar and streaks bucket days in **UTC** (documented decision;
  shown in the Goals screen).
- The frontend has unit tests for formatters and UI primitives; screen-level
  integration tests (mocked API) are a natural next step.
