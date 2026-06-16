# Agenda — Full-Stack Productivity App

[![CI](https://github.com/helberjf/agenda-react-vite/actions/workflows/ci.yml/badge.svg)](https://github.com/helberjf/agenda-react-vite/actions/workflows/ci.yml)

A full-stack personal productivity app focused on daily execution. It brings tasks, scheduling, a journal, history and category organization into a single interface, with authentication, a protected API and a deploy-ready setup for Vercel.

**Live demo:** https://agendapratica.vercel.app

## Quick overview

- **Type:** full-stack productivity application
- **Scope:** authentication, data modeling, React frontend, Node API, Firebase integration and deploy
- **Technical goal:** demonstrate building a real product, not just a basic CRUD
- **Main stack:** React 19, TypeScript, Vite, Node.js, Firebase Auth, Realtime Database and Vercel

## For recruiters

This project is structured to demonstrate end-to-end engineering skills:

- Modern UI with React, protected routing and state management
- Secure integration with Firebase Auth and Realtime Database
- Authenticated API with token validation via `firebase-admin`
- Performance-oriented modeling in Realtime Database, with a `tasksByDate` index
- Code organized by domain: hooks, services, stores and utilities
- Focus on real delivery: local environment, build, deploy and operational docs

## What exists today

- Authentication with Firebase Auth (email/password and Google)
- Dashboard with a summary of the day and the week
- "Today" view with tasks, schedules, filters and a daily log
- Weekly view with progress and grouping by date
- Calendar with FullCalendar (month, week and list modes)
- Daily history to review past tasks and logs
- Journal with day/month/list views
- Create and edit categories for tasks and events
- Export events to `.ics`

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 6, TypeScript |
| UI | Tailwind CSS, Radix UI, Lucide |
| Async state | TanStack Query |
| Local state | Zustand |
| Forms | React Hook Form + Zod |
| Calendar | FullCalendar |
| Auth & DB | Firebase Auth + Realtime Database |
| Backend | Node.js, Express, firebase-admin, Vercel Functions |

## Architecture

The project is no longer a 100% client-direct-to-Firebase model.

- **Frontend:** React + Vite
- **Auth:** Firebase Auth on the client
- **Main DB:** Firebase Realtime Database
- **Local API:** `dev-server.mjs` with Express on port 3001
- **Production:** serverless routes in `api/index.ts`, deployed on Vercel

Data flow: `tasks`, `events`, `dailyLogs` and category mutations go through the authenticated API (`/api/*`). The frontend sends the Firebase token in the `Authorization` header, and the API validates it with `firebase-admin` before touching the database. This keeps stricter Realtime Database rules for critical data while keeping a good real-time experience.

## Project structure

```
src/
  components/  # layout, tasks, events and shared UI
  hooks/       # auth, tasks, events, categories, daily logs, weekly goals
  lib/         # HTTP client, Firebase, validators and utilities
  pages/       # Dashboard, Today, Week, Calendar, History, Journal, Settings, Auth
  router/      # public and protected routes
  services/    # API and Firebase access
  store/       # Zustand stores
  types/       # domain types
api/
  index.ts     # serverless handler used in production
dev-server.mjs          # Express API used in local development
database.rules.json     # Realtime Database rules
vercel.json             # Vercel rewrites and build
```

## Getting started

```bash
# 1. install dependencies
npm install

# 2. create env files (frontend reads .env/.env.local; the local API reads .env)
cp .env.example .env
cp .env.example .env.local

# 3. fill in the variables (Firebase web config + service account)
# 4. publish the database rules
npm install -g firebase-tools
firebase login
firebase deploy --only database

# 5. run the project (frontend on :5173, local API on :3001)
npm run dev
```

### Scripts

```
npm run dev        # frontend + local API
npm run dev:vite   # frontend only
npm run dev:api    # local API only
npm run build      # production build
npm run lint       # lint src
npm run type-check # type checking
```

## API routes

Protected routes live under `/api/*` and require a Firebase token: `/api/tasks`, `/api/events`, `/api/logs`, `/api/categories`. In production they are served by `api/index.ts`; in development, by `dev-server.mjs`.

## Data model (Realtime Database)

```
tasks/{uid}/{taskId}
tasksByDate/{uid}/{yyyy-MM-dd}/{taskId}
events/{uid}/{eventId}
dailyLogs/{uid}/{yyyy-MM-dd}
weeklyGoals/{uid}/{yyyy-Www}/{goalId}
categories/{uid}/{categoryId}
users/{uid}/profile
users/{uid}/settings
```

The `tasksByDate` index exists to avoid scanning all of a user's tasks when querying a specific day.

## Deploy (Vercel)

- The frontend is built to `dist`.
- `vercel.json` rewrites `/api/:path*` to `api/index`.
- Node version expected: 20.x.
- Add all environment variables in the Vercel project, include the published domain in Firebase Auth → Authorized domains, and validate login, task creation, event creation and reads via `/api/*`.
