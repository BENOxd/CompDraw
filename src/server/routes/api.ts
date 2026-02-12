/**
 * Daily Draw Challenge - API routes
 * All endpoints require Reddit context (postId, subreddit). Auth via getCurrentUsername().
 */

import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type {
  LeaderboardResponse,
  ProfileResponse,
  PromptResponse,
  SubmissionsResponse,
  SubmitResponse,
  VoteResponse,
} from '../../shared/api';
import { getBadgeForWinCount } from '../store/badges';
import {
  addVote,
  getNextSubmissionId,
  getPromptForDate,
  getSubmission,
  getSubmissionIdsForDate,
  getUserSubmissionForDate,
  getUserWinCount,
  hasUserVoted,
  MAX_IMAGE_BASE64_LENGTH,
  saveSubmission,
  getVoteCount,
} from '../store/kv';
import { getUserPromptSubmissionForDate } from '../store/kv-prompts';

export const api = new Hono();

async function checkIsModerator(username: string): Promise<boolean> {
  const subredditName = context.subredditName;
  if (!subredditName) return false;
  try {
    const mods = await reddit
      .getModerators({ subredditName, username, limit: 1, pageSize: 1 })
      .all();
    return mods.length > 0;
  } catch {
    return false;
  }
}

/** Today's date in YYYY-MM-DD (UTC) */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sanitize base64: allow data URL or raw base64 PNG */
function sanitizeImageBase64(input: string): string | null {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!trimmed) return null;
  const base64 = trimmed.startsWith('data:') ? trimmed.split(',')[1] : trimmed;
  if (!base64 || base64.length > MAX_IMAGE_BASE64_LENGTH) return null;
  return base64;
}

/** GET /api/init - Initial load (prompt, profile, postId) */
api.get('/init', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json({ status: 'error', message: 'postId required' }, 400);
  }
  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const date = today();
    const prompt = await getPromptForDate(date);
    const hasSubmittedToday = (await getUserSubmissionForDate(username, date)) != null;
    const hasSubmittedPromptToday = (await getUserPromptSubmissionForDate(username, date)) != null;
    const winCount = await getUserWinCount(username);
    const badge = getBadgeForWinCount(winCount);
    const isModerator = await checkIsModerator(username);
    return c.json({
      type: 'init',
      postId,
      username,
      prompt,
      date,
      hasSubmittedPromptToday,
      isModerator,
      profile: {
        username,
        winCount,
        badge,
        hasSubmittedToday,
        date,
      },
    });
  } catch (err) {
    console.error('API init error:', err);
    return c.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Init failed' },
      500
    );
  }
});

/** GET /api/prompt - Current daily prompt */
api.get('/prompt', async (c) => {
  try {
    const date = today();
    const prompt = await getPromptForDate(date);
    return c.json<PromptResponse>({ prompt, date });
  } catch (err) {
    console.error('API prompt error:', err);
    return c.json({ status: 'error', message: 'Failed to get prompt' }, 500);
  }
});

/** POST /api/submit - Submit drawing (one per user per day) */
api.post('/submit', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<SubmitResponse>({ status: 'error', message: 'postId required' }, 400);
  }
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<SubmitResponse>({ status: 'error', message: 'You must be logged in to submit' }, 401);
    }
    const body = (await c.req.json()) as { imageBase64?: string };
    const imageBase64 = sanitizeImageBase64(body.imageBase64 ?? '');
    if (!imageBase64) {
      return c.json<SubmitResponse>({
        status: 'error',
        message: 'Invalid or too large image. Use a PNG under ~500KB.',
      }, 400);
    }
    const date = today();
    const existing = await getUserSubmissionForDate(username, date);
    if (existing) {
      return c.json<SubmitResponse>({
        status: 'error',
        message: 'You already submitted today. One submission per day.',
      }, 409);
    }
    const id = await getNextSubmissionId();
    const submission = {
      id,
      username,
      postId,
      date,
      timestamp: Date.now(),
      imageBase64: 'data:image/png;base64,' + imageBase64,
    };
    await saveSubmission(submission);
    return c.json<SubmitResponse>({
      status: 'ok',
      submissionId: id,
      message: 'Drawing submitted!',
    });
  } catch (err) {
    console.error('API submit error:', err);
    return c.json<SubmitResponse>({ status: 'error', message: 'Submission failed' }, 500);
  }
});

/** GET /api/submissions - List submissions for today (with optional vote counts and hasVoted) */
api.get('/submissions', async (c) => {
  try {
    const date = today();
    const username = (await reddit.getCurrentUsername()) ?? null;
    const ids = await getSubmissionIdsForDate(date);
    const submissions = await Promise.all(
      ids.map(async (id) => {
        const sub = await getSubmission(id);
        if (!sub) return null;
        const voteCount = await getVoteCount(id);
        const hasVoted = username ? await hasUserVoted(id, username) : false;
        return {
          id: sub.id,
          username: sub.username,
          postId: sub.postId,
          date: sub.date,
          timestamp: sub.timestamp,
          imageUrl: sub.imageBase64,
          voteCount,
          hasVoted,
        };
      })
    );
    const list = submissions.filter((s): s is NonNullable<typeof s> => s != null);
    return c.json<SubmissionsResponse>({ status: 'ok', submissions: list, date });
  } catch (err) {
    console.error('API submissions error:', err);
    return c.json<SubmissionsResponse>({ status: 'error', message: 'Failed to load submissions' }, 500);
  }
});

/** POST /api/vote - Vote for a submission (one per user per submission, rate limited) */
api.post('/vote', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<VoteResponse>({ status: 'error', message: 'You must be logged in to vote' }, 401);
    }
    const body = (await c.req.json()) as { submissionId?: string };
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId.trim() : '';
    if (!submissionId) {
      return c.json<VoteResponse>({ status: 'error', message: 'submissionId required' }, 400);
    }
    const sub = await getSubmission(submissionId);
    if (!sub) {
      return c.json<VoteResponse>({ status: 'error', message: 'Submission not found' }, 404);
    }
    if (sub.username === username) {
      return c.json<VoteResponse>({ status: 'error', message: 'You cannot vote for your own submission' }, 400);
    }
    const date = today();
    const result = await addVote(submissionId, username, date);
    if (result.error) {
      return c.json<VoteResponse>({ status: 'error', message: result.error }, 400);
    }
    return c.json<VoteResponse>({ status: 'ok', voteCount: result.voteCount });
  } catch (err) {
    console.error('API vote error:', err);
    return c.json<VoteResponse>({ status: 'error', message: 'Vote failed' }, 500);
  }
});

/** GET /api/leaderboard - Top 3 for today (podium) */
api.get('/leaderboard', async (c) => {
  try {
    const date = today();
    const ids = await getSubmissionIdsForDate(date);
    if (ids.length === 0) {
      return c.json<LeaderboardResponse>({ status: 'ok', entries: [], date });
    }
    const withVotes = await Promise.all(
      ids.map(async (id) => {
        const sub = await getSubmission(id);
        const voteCount = sub ? await getVoteCount(id) : 0;
        return { id, sub, voteCount };
      })
    );
    withVotes.sort((a, b) => b.voteCount - a.voteCount);
    const top3 = withVotes.slice(0, 3);
    const entries = top3.map((item, i) => ({
      rank: (i + 1) as 1 | 2 | 3,
      submissionId: item.id,
      username: item.sub ? item.sub.username : 'unknown',
      voteCount: item.voteCount,
      imageUrl: item.sub ? item.sub.imageBase64 : '',
    }));
    return c.json<LeaderboardResponse>({ status: 'ok', entries, date });
  } catch (err) {
    console.error('API leaderboard error:', err);
    return c.json<LeaderboardResponse>({ status: 'error', message: 'Failed to load leaderboard' }, 500);
  }
});

/** GET /api/profile - Current user profile (badges, wins, hasSubmittedToday) */
api.get('/profile', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const date = today();
    const winCount = await getUserWinCount(username);
    const badge = getBadgeForWinCount(winCount);
    const hasSubmittedToday = (await getUserSubmissionForDate(username, date)) != null;
    return c.json<ProfileResponse>({
      status: 'ok',
      profile: { username, winCount, badge, hasSubmittedToday, date },
    });
  } catch (err) {
    console.error('API profile error:', err);
    return c.json<ProfileResponse>({ status: 'error', message: 'Failed to load profile' }, 500);
  }
});
