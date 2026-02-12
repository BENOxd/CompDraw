# Daily Draw Challenge – Deployment Guide

## Prerequisites

- Node.js >= 22.2.0
- Reddit account with Devvit CLI logged in
- Subreddit where you have moderator rights (to install the app)

## Build & Deploy

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Type-check and lint**
   ```bash
   npm run type-check
   npm run lint
   ```

3. **Run tests**
   ```bash
   npm run test
   ```

4. **Build**
   ```bash
   npm run build
   ```
   This produces:
   - `dist/client/` – WebView assets (splash.html, game.html, JS/CSS)
   - `dist/server/` – Server bundle (index.cjs)

5. **Upload to Reddit**
   ```bash
   npm run deploy
   ```
   Or in one step: `npm run type-check && npm run lint && npm run test && devvit upload`

6. **Install on a subreddit**
   - In the Reddit Developer Portal or via CLI, install the app on your subreddit.
   - Ensure **Redis** permission is enabled (required for prompts, submissions, votes, winners).

## Configuration (devvit.json)

- **Post entrypoints**
  - `default` (inline): `splash.html` – shown in the feed.
  - `game`: `game.html` – expanded view (draw, gallery, leaderboard, profile).

- **Menu (mod only)**
  - “Create daily challenge post” → creates a new post with today’s prompt.
  - “Set prompt override” → form to override today’s prompt.

- **Scheduler**
  - `daily-rollover`: runs at **00:01 UTC** every day (`1 0 * * *`).
  - Closes the previous day (winners, comment on post), sets today’s prompt, creates today’s post.

- **Triggers**
  - `onAppInstall`: creates an initial post when the app is installed.

- **Permissions**
  - `redis: true` – required for KV store (prompts, submissions, votes, winners, badges).

## First-time setup

1. Deploy the app and install it on your subreddit.
2. On install, the trigger creates one post. You can also use the subreddit menu: “Create daily challenge post”.
3. (Optional) Use “Set prompt override” to set today’s prompt; otherwise the default rotation is used.
4. The daily cron at 00:01 UTC will:
   - Close the previous day and comment winners on that day’s post.
   - Create a new post for the new day with the prompt in the title.

## Environment

- The app runs entirely on Reddit (Devvit WebView + serverless backend). No external servers.
- Data is stored in Redis (KV store) per installation (per subreddit).

## Troubleshooting

- **“postId required”** – The app must be opened from a Reddit post (custom post). Open from the post created by the app or “Create daily challenge post”.
- **Scheduler not running** – Confirm `scheduler.tasks.daily-rollover` and `permissions.redis` are set in devvit.json and re-upload.
- **No prompt** – Use “Set prompt override” or rely on the default prompt rotation; the daily job also sets the current prompt.
