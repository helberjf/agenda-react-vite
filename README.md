# Agenda — Personal Productivity App

[![CI](https://github.com/helberjf/agenda-react-vite/actions/workflows/ci.yml/badge.svg)](https://github.com/helberjf/agenda-react-vite/actions/workflows/ci.yml)

A React and TypeScript application that brings daily tasks, calendar events, weekly goals and a journal into one workspace. Firebase provides authentication and persistence; a Node API handles the main task, event and journal operations.

[Published application](https://agendapratica.vercel.app) · [Deployment guide](DEPLOY.md) · [Local setup guide, Portuguese](GUIA_LOCAL_E_DEPLOY.md)

## Explore the workflow

1. Sign in with email/password or Google using a configured Firebase project.
2. Create a category and a dated task in the Today view, then mark the task complete.
3. Add an event and compare it in the weekly and FullCalendar views; export events as `.ics`.
4. Write a daily log and revisit it through History or Journal.

The interface also includes category filters and weekly goals. UI text is primarily Portuguese.

## Architecture and source tour

| Area | Entry point | Responsibility |
| --- | --- | --- |
| Pages and navigation | [src/pages](src/pages), [src/router](src/router) | Daily, weekly, calendar and journal screens |
| Domain access | [src/services](src/services) | Tasks, events, logs, categories and weekly goals |
| API client | [src/lib/api.ts](src/lib/api.ts) | Sends the Firebase ID token with requests |
| Local API | [dev-server.mjs](dev-server.mjs) | Express API on port 3001 |
| Hosted API | [api/index.ts](api/index.ts) | Vercel function handler |
| Database policy | [database.rules.json](database.rules.json) | Per-user Realtime Database access rules |

The stack includes React 19, Vite 6, TypeScript, TanStack Query, Zustand, Tailwind, Radix UI, Firebase Auth and Realtime Database. Tasks, events and logs use the API. Category writes use the API while category subscriptions and weekly goals still use the Firebase client directly.

## Run locally

Use Node.js **20.x**, as declared in [package.json](package.json). Create a Firebase project, enable the intended sign-in providers and Realtime Database, and authorize the local application domain.

```bash
git clone https://github.com/helberjf/agenda-react-vite.git
cd agenda-react-vite
npm install
```

Copy [`.env.example`](.env.example) to `.env`. Fill the `VITE_FIREBASE_*` web configuration and the server-only `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_DATABASE_URL` values. Keep service-account credentials out of variables prefixed with `VITE_`. The local API reads `.env`; Vite also reads `.env` and supports `.env.local` overrides.

Publish the checked-in database rules to your selected Firebase project, then start both processes:

```bash
npx firebase-tools login
npx firebase-tools deploy --only database --project YOUR_FIREBASE_PROJECT_ID
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs on port 3001. `npm run dev:vite` and `npm run dev:api` start them separately.

## Checks and deployment

```bash
npm run type-check
npm run build
```

The checked-in CI runs type checking and the build. No automated behavioral test suite is configured. A `lint` script exists, but this snapshot has no ESLint configuration, so it is not presented as a working validation gate.

[vercel.json](vercel.json) routes `/api/*` to the hosted handler and serves the frontend build from `dist`. Configure the same environment values and Firebase authorized domain for the deployed site.

## Design tradeoffs

- **API mediation plus direct subscriptions:** server-side token verification centralizes important mutations, while Firebase subscriptions keep category updates simple. Both database rules and API authorization remain part of the access boundary.
- **Denormalized date index:** `tasksByDate` avoids reading every task for a daily view; task creation, date changes and deletion must keep the index aligned with the primary task records.
- **Two API entry points:** Express makes local development straightforward and Vercel functions fit the hosted setup, but changes must remain consistent across both handlers.
- **Separate state tools:** TanStack Query manages remote data and Zustand manages local UI/auth state. This clarifies responsibilities at the cost of more than one state-management abstraction.
