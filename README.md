# Daily Draw Challenge

A Reddit-native app that runs inside a Reddit post using Devvit WebView and a Devvit backend. Each day has a prompt; users draw on an HTML5 canvas, submit one drawing per day, vote on others, and the top 3 win badges (Bronze, Silver, Gold).

## Tech stack

- **Reddit Devvit** (WebView + serverless backend)
- **TypeScript**, **React 19**, **Tailwind CSS 4**, **Vite**
- **Hono** (API routes)
- **HTML5 Canvas** (drawing), **KV Store (Redis)**, **Devvit Scheduler**

## Features

- **Reddit post integration** – Each daily challenge is a custom post; app renders inline (splash) and expanded (game).
- **Daily prompt** – One prompt per day in KV store; rotation via scheduler; mod override.
- **Drawing canvas** – Touch + mouse, pen, eraser, undo, color picker; export as PNG.
- **Submissions** – One per user per day; stored with username, post ID, date, timestamp.
- **Gallery** – Grid of today’s submissions; tap to zoom; vote (one per user per submission).
- **Leaderboard** – Top 3 by votes; podium UI.
- **Winners** – Stored in KV; bot comments winners on the post after rollover.
- **Badges** – Bronze (1), Silver (3), Gold (5) wins; persisted per user.
- **Scheduler** – Daily cron at 00:01 UTC: close previous day, comment winners, create new post.
- **Anti-cheat** – Duplicate submission block, no self-vote, vote rate limit.

## Project structure

- `src/client/` – WebView frontend (splash, game, canvas, gallery, leaderboard, profile).
- `src/server/` – Backend (API routes, KV store, post creation, scheduler, menu, forms).
- `src/shared/` – Shared types (API request/response, prompts).
- `docs/` – [DEPLOYMENT.md](docs/DEPLOYMENT.md), [TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md).

## Commands

- `npm run type-check` – TypeScript type check
- `npm run lint` – ESLint
- `npm run test` – Run tests
- `npm run build` – Build client and server
- `npm run deploy` – Type-check, lint, test, then `devvit upload`
- `npm run dev` – Devvit playtest (develop live on Reddit)

## Getting started

1. Node.js >= 22.2.0.
2. `npm install`
3. `devvit login` (Reddit + Devvit)
4. `npm run build` then `devvit upload`; install the app on a subreddit where you’re a mod.
5. Use “Create daily challenge post” from the subreddit menu, or rely on the on-app-install trigger and the daily cron.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment steps and [docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md) for testing.
