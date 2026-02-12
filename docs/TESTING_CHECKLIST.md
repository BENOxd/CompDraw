# Daily Draw Challenge – Testing Checklist

Use this list to verify core flows before a demo or release.

## Build & quality

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` completes without errors

## Reddit post integration

- [ ] App renders inside a Reddit custom post (inline view shows splash)
- [ ] “Tap to draw” opens the expanded view (game)
- [ ] Post title shows the daily prompt (e.g. “Daily Draw Challenge: Draw your spirit animal”)
- [ ] Moderator menu “Create daily challenge post” creates a new post and navigates to it

## Daily prompt

- [ ] GET /api/prompt returns current prompt and date
- [ ] Init (GET /api/init) returns the same prompt and date
- [ ] Moderator “Set prompt override” form saves and clears override; prompt reflects in app

## Drawing canvas

- [ ] Canvas loads and is drawable (pen)
- [ ] Touch and mouse both draw
- [ ] Eraser, undo, clear work
- [ ] Color picker changes pen color
- [ ] Submit exports PNG and calls submit API

## Submission

- [ ] Submit sends drawing; success toast and redirect to Gallery
- [ ] Second submit same day is blocked (one per user per day)
- [ ] Submissions list (GET /api/submissions) includes the new drawing with username and vote count

## Voting

- [ ] Vote on another user’s submission increases vote count
- [ ] Cannot vote on own submission
- [ ] Cannot vote twice on the same submission
- [ ] Vote count updates in Gallery and Leaderboard

## Leaderboard

- [ ] Leaderboard shows top 3 by vote count (podium)
- [ ] Leaderboard date matches current day

## Profile & badges

- [ ] Profile shows username, win count, badge (none / bronze / silver / gold)
- [ ] “You submitted today” appears when user has submitted today

## Scheduler (daily rollover)

- [ ] Cron task is configured in devvit.json (`daily-rollover` at 00:01 UTC)
- [ ] After rollover (or simulated): previous day’s post has a winner comment (1st, 2nd, 3rd)
- [ ] New day has a new post with new prompt
- [ ] Winner user win counts and badges update (e.g. first win → bronze)

## Anti-cheat (server-side)

- [ ] Duplicate submission same user same day returns 409 or error message
- [ ] Self-vote returns error
- [ ] Vote limit per user per day is enforced (e.g. 50 votes)

## UI/UX

- [ ] Layout is vertical; bottom toolbar for canvas actions
- [ ] Buttons are large enough for one-thumb use
- [ ] Dark mode; no broken contrast
- [ ] Loading states (skeletons or “Loading…”) where appropriate
- [ ] Error messages (toast or inline) on submit/vote failure

## Edge cases

- [ ] Logged-out user: init still returns prompt; submit/vote require login (401 or message)
- [ ] Empty gallery shows “No submissions yet”
- [ ] Empty leaderboard shows “No votes yet” or similar
