# CodeTrack — DSA Progress & Intelligence Platform

<div align="center">

**🌐 Live app:** https://codetrack-lime.vercel.app &nbsp;·&nbsp; **⚙️ API:** https://codetrack-api-a6i1.onrender.com &nbsp;·&nbsp; **📦 Repository:** https://github.com/ankit-karan/codetrack

A full-stack MERN application that turns your DSA practice into measurable progress —
log every question you solve, get real analytics on topics and difficulty mix,
plan spaced-repetition revisions, and protect daily/weekly goals and streaks.

</div>

---

## Table of contents

- [Problem statement](#problem-statement)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Application architecture](#application-architecture)
- [Folder structure](#folder-structure)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)
- [Environment variable configuration](#environment-variable-configuration)
- [MongoDB Atlas setup](#mongodb-atlas-setup)
- [API endpoint documentation](#api-endpoint-documentation)
- [Screenshots](#screenshots)
- [Testing](#testing)
- [Deployment information](#deployment-information)
- [Live application](#live-application)
- [Known limitations](#known-limitations)
- [Future enhancements](#future-enhancements)

---

## Problem statement

Preparing for technical interviews typically means juggling coding sheets,
platform tabs, spreadsheets and sticky notes:

- **Progress is scattered** — questions solved on LeetCode, GfG and elsewhere
  leave no single place to see *how much* you have actually covered, per topic
  or difficulty.
- **No analytics** — you cannot answer "which topics are weak?", "am I solving
  more this week than last?", or "what does my difficulty mix look like?".
- **Revisions are forgotten** — spaced repetition is the proven way to retain
  solved problems, but nothing in a raw sheet tells you *when to revisit* each
  question.
- **Motivation fades** — without streaks, goals and a contribution view,
  consistent daily practice is hard to sustain.
- **Ownership & privacy** — generic sheets are either public or unusable; there
  is no self-hosted, per-user private tracker.

**CodeTrack solves this** with one private workspace per user: every number on
every screen is computed **from your own database records** — no hardcoded
stats, no fake backend responses.

---

## Features

| Area | What it does |
|------|--------------|
| **Auth** | Register / login / logout with JWT, protected routes, per-user data ownership — every query is scoped to the authenticated user and cross-user access returns `404`. |
| **Dashboard** | KPI cards (total/solved/attempted/unsolved, easy/medium/hard), coding streak, daily & weekly goal progress, difficulty & status donut charts, 7-day & 30-day activity charts, topic progress bars, weak-topic alerts, overdue-revision reminders. |
| **Question manager** | Full CRUD (title, platform, URL, topic, difficulty, status, complexity, notes, language, dates), filters by topic/difficulty/status/platform, sorting, full-text search, server-side pagination, inline status toggle, "schedule revision" shortcut, table/card layouts, distinct empty states for zero-data vs zero-match. |
| **Topic analytics** | All 18 fixed DSA topics with per-topic completion rates, difficulty breakdowns, aggregate mastery stats and automatic weak-topic detection (3+ questions, <50% solved). |
| **Revision planner** | Spaced-repetition queue (Due / Overdue / Completed tabs) built from your solve history — mark done, snooze +3 days, delete. |
| **Goals & streaks** | Daily (1–50) and weekly (1–350) targets with goal periods, live progress bars, current/longest streak from real `solvedAt` dates (UTC day buckets), 16-week practice contribution calendar. |
| **Profile** | Name, daily target, LeetCode / GeeksforGeeks profile URLs, password change, account stats. Profile URLs are **manually pasted reference links** — CodeTrack does **not** automatically sync with any external platform. |
| **Theme** | Dark / light mode persisted locally. |

---

## Technology stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, JavaScript (ESM), Tailwind CSS v4, React Router v7, Axios, Recharts, Lucide icons |
| **Backend** | Node.js, Express 4 (CommonJS), JWT auth (`jsonwebtoken` + `bcryptjs`), express-validator, Helmet, Morgan, centralized error handler |
| **Database** | MongoDB Atlas (Mongoose ODM), database name `codetrack` |
| **Testing** | Backend: Jest + Supertest + mongodb-memory-server · Frontend: Vitest + React Testing Library · Lint: ESLint (strict react-hooks v7 / React Compiler rules) |
| **Deployment** | Vercel (frontend) + Render (backend) + MongoDB Atlas (database) |

---

## Application architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser — React SPA (Vercel, static dist/)                            │
│  contexts (Auth/Theme/Toast) · services (axios + JWT interceptor)      │
│  route-level code splitting (React.lazy) · VITE_API_URL → Render API   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  HTTPS  ·  Authorization: Bearer <JWT>
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Express API (Render, /api/*)                                          │
│                                                                         │
│  helmet → morgan → cors (origin allow-list from CLIENT_URL)            │
│      → router → protect (JWT → req.user)                               │
│      → express-validator rules → validate (400 + field details)        │
│      → controller (asyncHandler, ownership-scoped queries)             │
│      → Mongoose models (User, Problem, Revision, Goal)                 │
│                                                                         │
│  errors → ApiError → central handler → { success:false, message, … }   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │  Mongoose (dbName forced to `codetrack`,
                                │  retry at boot, runtime error listeners)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MongoDB Atlas — database `codetrack`                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Request lifecycle (example: `PATCH /api/problems/:id/status`)**

1. Vite/Vercel serves the SPA; the axios instance attaches the JWT from `localStorage`.
2. Express middleware stack runs (security headers → logging → CORS allow-list).
3. `protect` verifies the signature & expiry, loads `req.user`.
4. Validation rules run; failures return `400` with `errors: [{ field, message }]`.
5. The controller loads the document **filtered by `userId`** — another user's id yields `404`, never data leakage.
6. The change is persisted; the response is enveloped as `{ success: true, data }`.

**Key design decisions**

- **Ownership isolation** — every model query includes `userId`; covered by tests (cross-user read/update/delete → 404).
- **Server-computed stats** — analytics endpoints aggregate in MongoDB (`$match` on `userId` first), so the dashboard can never show numbers that aren't in your records.
- **UTC day bucketing** — streaks and activity charts bucket by UTC date for deterministic results.
- **Boot-before-listen** — `server.js` awaits the Atlas connection (with retries) before `app.listen`, so the API never accepts requests without a database.
- **Security** — bcrypt password hashing, short-lived JWTs, Helmet, CORS origin allow-list, input validation on every route, `.env` files git-ignored (never committed — verified in git history).

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
│   ├── vercel.json             # SPA rewrites (must live in the Root Directory)
│   └── vite.config.js          # dev proxy /api → :5000, vitest config
├── server/                     # Express REST API
│   ├── scripts/seedDemo.js     # demo account seeder
│   └── src/
│       ├── app.js              # middleware, routes, error handling
│       ├── server.js           # entrypoint (connects DB, starts listener)
│       ├── config/db.js        # Atlas connection with retry + dbName codetrack
│       ├── controllers/        # auth, problem, analytics, revision, goal, profile
│       ├── middleware/         # auth (JWT protect), rules, validate, errorHandler
│       ├── models/             # User, Problem, Revision, Goal (Mongoose)
│       ├── routes/             # one router per domain
│       ├── tests/              # Jest + Supertest suites (mongodb-memory-server)
│       └── utils/              # ApiError, asyncHandler, response, dates, constants
├── docs/screenshots/           # product screenshots (see below)
├── .env.example                # points at server/.env.example
├── .gitignore
├── render.yaml                 # Render blueprint (backend)
└── README.md                   # this file
```

---

## Installation

### Prerequisites

- **Node.js ≥ 18** and npm
- A **MongoDB Atlas** cluster (free tier is enough) — see [MongoDB Atlas setup](#mongodb-atlas-setup)
- Git

### Backend setup

```bash
git clone https://github.com/ankit-karan/codetrack.git
cd codetrack/server
npm install
cp .env.example .env          # then edit .env (see environment variables below)
npm run dev                   # API on http://localhost:5000
```

- `npm run dev` — Nodemon in development
- `npm start` — plain Node in production
- `npm test` — Jest suite (uses an in-memory MongoDB, no Atlas needed)
- `npm run seed:demo` — optional demo data → `demo@codetrack.dev` / `demo1234`

The server refuses to start without `MONGODB_URI` / `JWT_SECRET`, retries the
Atlas connection at boot, and only begins listening once the database is ready.

### Frontend setup

```bash
cd ../client        # from codetrack/
npm install
npm run dev         # UI on http://localhost:5173
```

No frontend configuration is needed locally: the Vite dev server proxies
`/api/*` to `http://localhost:5000`, so CORS never comes into play during
development. Open **http://localhost:5173** and register an account.

Other scripts: `npm test` (Vitest), `npm run lint` (ESLint), `npm run build`
(production bundle with route-level code splitting).

---

## Environment variable configuration

> **Never commit real `.env` files.** Root `.gitignore` excludes `.env`,
> `.env.*` (except `.env.example`) and `node_modules/` — verified: no `.env`
> file has ever existed in this repository's history.

**`server/.env`** (copy from `server/.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string (the API exits without it) |
| `JWT_SECRET` | ✅ | Long random secret used to sign JWTs (e.g. `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `JWT_EXPIRES_IN` | – | Token lifetime, default `7d` |
| `PORT` | – | API port, default `5000` (Render sets `10000`) |
| `CLIENT_URL` | – | Comma-separated allowed CORS origins, default `http://localhost:5173` |
| `NODE_ENV` | – | `development` \| `production` \| `test` |

**`client/.env`** (optional — copy from `client/.env.example`):

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL. Unset in dev (Vite proxy); set `https://<backend>/api` in production |
| `VITE_PROXY_TARGET` | Dev-proxy target, default `http://localhost:5000` |

---

## MongoDB Atlas setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → create a user with *Read and write to any database*.
3. **Network Access** → allow your IP (`0.0.0.0/0` if the backend runs on Render).
4. **Database → Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority`
5. Paste it into `server/.env` as `MONGODB_URI`.
   The API forces the database name to **`codetrack`** regardless of the path
   in the URI, so all collections live in one predictable database.
6. (Optional) seed demo data: `cd server && npm run seed:demo`
   → login `demo@codetrack.dev` / `demo1234`.

> The Atlas username/password are **manual configuration** — they live only in
> your local `server/.env` and Render's dashboard, both git-ignored.

---

## API endpoint documentation

Base URL: `/api` (production: `https://codetrack-api-a6i1.onrender.com/api`) ·
All protected routes require `Authorization: Bearer <jwt>` ·
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
| GET / PATCH | `/profile` | Profile + stats / update profile & password |
| GET | `/health` | Liveness probe (`status`, `uptime`, `environment`) |

---

## Screenshots

> **Screenshots are added manually.** Save your captures into
> `docs/screenshots/` using the exact file names below (see
> [`docs/screenshots/README.md`](docs/screenshots/README.md) for details) —
> the images will render here automatically once committed.

| Screen | Preview |
|--------|---------|
| Login | ![Login](docs/screenshots/login.png) |
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| Question manager | ![Questions](docs/screenshots/questions.png) |
| Topic analytics | ![Topics](docs/screenshots/topics.png) |
| Goals & streaks | ![Goals](docs/screenshots/goals.png) |

---

## Testing

```bash
# Backend — Jest + Supertest + mongodb-memory-server
cd server && npm test

# Frontend — Vitest + React Testing Library
cd client && npm test

# Lint (strict react-hooks v7 / React Compiler rules)
cd client && npm run lint

# Production build
cd client && npm run build
```

**Results**

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

## Deployment information

| Component | Service | URL |
|-----------|---------|-----|
| Frontend | Vercel (Root Directory `client`, Vite preset) | https://codetrack-lime.vercel.app |
| Backend | Render (blueprint from `render.yaml`) | https://codetrack-api-a6i1.onrender.com |
| Database | MongoDB Atlas (M0) | database `codetrack` |

### Backend → Render

1. Render → **New → Blueprint** → select the GitHub repo (uses `render.yaml`).
2. Environment variables: `MONGODB_URI` (your Atlas URI), `JWT_SECRET`
   (auto-generated by the blueprint), `CLIENT_URL` = the Vercel frontend URL.
3. Render installs `server/` dependencies, runs `npm start`, and health-checks
   `/api/health`. The service waits for the Atlas connection before listening.

### Frontend → Vercel

1. Vercel → **New Project** → import the repo.
2. **Root Directory** = `client`, framework = **Vite**, build = `npm run build`,
   output = `dist`.
3. Environment variable: `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`.
4. `client/vercel.json` provides the SPA fallback rewrite so deep links work on
   refresh. No API proxy is needed — the app calls the Render backend directly.
5. After both are live, set `CLIENT_URL` on Render to the final Vercel domain
   (CORS is origin-checked).

> **Note:** Render's free tier spins down after inactivity — the first request
> after idle can take ~30–60s.

---

## Live application

| | |
|---|---|
| **Frontend** | https://codetrack-lime.vercel.app |
| **Backend API** | https://codetrack-api-a6i1.onrender.com/api/health |
| **GitHub repository** | https://github.com/ankit-karan/codetrack |

---

## Known limitations

- **No automatic platform sync** — LeetCode/GfG URLs are reference links you
  paste yourself (by design; stated in the UI and this README).
- Revisions are scheduled manually (one-click from the question table) rather
  than auto-generated from solve dates.
- No email verification / password reset flows — credentials are username +
  password only.
- Practice calendar and streaks bucket days in **UTC** (documented decision;
  shown in the Goals screen).
- Frontend tests cover formatters and UI primitives; screen-level integration
  tests (mocked API) are still open.

---

## Future enhancements

- **Automatic problem import** — OAuth-based sync of solved problems from
  LeetCode / GeeksforGeeks / Codeforces profiles (explicitly out of scope for
  v1, but the profile URL fields are the seam for it).
- **Auto-generated revision schedule** — derive spaced-repetition intervals
  (e.g. SM-2 style) from difficulty and self-rated confidence instead of
  manual scheduling.
- **Email / password reset** — verification mails and recovery flows.
- **Tags & company filters** — free-form tags and company-wise question sets.
- **Export & share** — CSV / PDF exports of progress and public shareable
  profile pages (opt-in).
- **PWA + offline cache** — installable app with offline question capture.
- **CI/CD** — GitHub Actions running the two test suites and lint on every PR,
  with preview deployments.
- **Screen-level E2E tests** — Playwright journeys for register → solve →
  revise → goals.

---

*Maintained by [ankit-karan](https://github.com/ankit-karan) — contributions and
issues welcome on [GitHub](https://github.com/ankit-karan/codetrack).*
