/**
 * User-generated prompt system - API routes
 * POST /submit, POST /vote, GET /list, GET /top, POST /admin/select
 */

import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type {
  PromptAdminSelectResponse,
  PromptIdeaDisplay,
  PromptListResponse,
  PromptSubmitResponse,
  PromptTopResponse,
  PromptVoteResponse,
} from '../../shared/api';
import {
  addPromptVote,
  getNextPromptId,
  getPendingPromptIds,
  getPrompt,
  getPromptVoteCount,
  getCurrentDailyPromptForDate,
  getUserPromptSubmissionForDate,
  hasUserVotedOnPrompt,
  PROMPT_MAX_LENGTH,
  PROMPT_MIN_LENGTH,
  savePrompt,
  setCurrentDailyPromptForDate,
  setUserPromptSubmission,
  updatePromptStatus,
} from '../store/kv-prompts';
import { getUserWinCount as getDrawingUserWinCount } from '../store/kv';
import { containsProfanity } from '../utils/profanity';

export const promptApi = new Hono();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Check if current user is a moderator of the subreddit */
async function isModerator(username: string): Promise<boolean> {
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

/** Add winner bonus: prompt creator's drawing wins = +1 vote per win */
async function getEffectiveVoteCount(
  promptId: string,
  voteCount: number
): Promise<number> {
  const p = await getPrompt(promptId);
  if (!p) return voteCount;
  const winCount = await getDrawingUserWinCount(p.createdBy);
  return voteCount + winCount;
}

/** POST /api/prompt/submit - Submit a new prompt idea (1 per user per day) */
promptApi.post('/submit', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<PromptSubmitResponse>(
        { status: 'error', message: 'You must be logged in to submit' },
        401
      );
    }
    const body = (await c.req.json()) as { text?: string };
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (text.length < PROMPT_MIN_LENGTH) {
      return c.json<PromptSubmitResponse>({
        status: 'error',
        message: `Prompt must be at least ${PROMPT_MIN_LENGTH} characters`,
      }, 400);
    }
    if (text.length > PROMPT_MAX_LENGTH) {
      return c.json<PromptSubmitResponse>({
        status: 'error',
        message: `Prompt must be at most ${PROMPT_MAX_LENGTH} characters`,
      }, 400);
    }
    if (containsProfanity(text)) {
      return c.json<PromptSubmitResponse>({
        status: 'error',
        message: 'Prompt contains inappropriate content',
      }, 400);
    }
    const date = today();
    const existing = await getUserPromptSubmissionForDate(username, date);
    if (existing) {
      return c.json<PromptSubmitResponse>({
        status: 'error',
        message: 'You already submitted a prompt today. One per day.',
      }, 409);
    }
    const id = await getNextPromptId();
    const prompt = {
      id,
      text,
      createdBy: username,
      createdAt: Date.now(),
      voteCount: 0,
      status: 'pending' as const,
    };
    await savePrompt(prompt);
    await setUserPromptSubmission(username, date, id);
    return c.json<PromptSubmitResponse>({
      status: 'ok',
      promptId: id,
      message: 'Prompt submitted!',
    });
  } catch (err) {
    console.error('Prompt submit error:', err);
    return c.json<PromptSubmitResponse>({ status: 'error', message: 'Submit failed' }, 500);
  }
});

/** POST /api/prompt/vote - Upvote a prompt (1 per user per prompt, rate limited) */
promptApi.post('/vote', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<PromptVoteResponse>(
        { status: 'error', message: 'You must be logged in to vote' },
        401
      );
    }
    const body = (await c.req.json()) as { promptId?: string };
    const promptId = typeof body.promptId === 'string' ? body.promptId.trim() : '';
    if (!promptId) {
      return c.json<PromptVoteResponse>({ status: 'error', message: 'promptId required' }, 400);
    }
    const p = await getPrompt(promptId);
    if (!p) {
      return c.json<PromptVoteResponse>({ status: 'error', message: 'Prompt not found' }, 404);
    }
    if (p.status !== 'pending') {
      return c.json<PromptVoteResponse>({ status: 'error', message: 'Can only vote on pending prompts' }, 400);
    }
    if (p.createdBy === username) {
      return c.json<PromptVoteResponse>({ status: 'error', message: 'Cannot vote for your own prompt' }, 400);
    }
    const date = today();
    const result = await addPromptVote(promptId, username, date);
    if (result.error) {
      return c.json<PromptVoteResponse>({ status: 'error', message: result.error }, 400);
    }
    return c.json<PromptVoteResponse>({ status: 'ok', voteCount: result.voteCount });
  } catch (err) {
    console.error('Prompt vote error:', err);
    return c.json<PromptVoteResponse>({ status: 'error', message: 'Vote failed' }, 500);
  }
});

/** GET /api/prompt/list - List pending prompts (sorted by effective vote count) */
promptApi.get('/list', async (c) => {
  try {
    const date = today();
    const username = (await reddit.getCurrentUsername()) ?? null;
    const ids = await getPendingPromptIds();
    const items: PromptIdeaDisplay[] = [];
    for (const id of ids) {
      const p = await getPrompt(id);
      if (!p || p.status !== 'pending') continue;
      const voteCount = await getPromptVoteCount(id);
      const effectiveVoteCount = await getEffectiveVoteCount(id, voteCount);
      const hasVoted = username ? await hasUserVotedOnPrompt(id, username) : false;
      items.push({
        ...p,
        voteCount,
        effectiveVoteCount,
        hasVoted,
      });
    }
    items.sort((a, b) => (b.effectiveVoteCount ?? b.voteCount) - (a.effectiveVoteCount ?? a.voteCount));
    return c.json<PromptListResponse>({ status: 'ok', prompts: items, date });
  } catch (err) {
    console.error('Prompt list error:', err);
    return c.json<PromptListResponse>({ status: 'error', message: 'Failed to load prompts' }, 500);
  }
});

/** GET /api/prompt/top - Get today's selected prompt (or null) */
promptApi.get('/top', async (c) => {
  try {
    const date = today();
    const text = await getCurrentDailyPromptForDate(date);
    if (!text) {
      return c.json<PromptTopResponse>({ status: 'ok', prompt: null, date });
    }
    return c.json<PromptTopResponse>({
      status: 'ok',
      prompt: {
        id: '',
        text,
        createdBy: '',
        createdAt: 0,
        voteCount: 0,
        status: 'selected',
      },
      date,
    });
  } catch (err) {
    console.error('Prompt top error:', err);
    return c.json<PromptTopResponse>({ status: 'error', message: 'Failed to load prompt' }, 500);
  }
});

/** POST /api/prompt/admin/reject - Reject a prompt (mod only) */
promptApi.post('/admin/reject', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json({ status: 'error', message: 'You must be logged in' }, 401);
    }
    const isMod = await isModerator(username);
    if (!isMod) {
      return c.json({ status: 'error', message: 'Moderator access required' }, 403);
    }
    const body = (await c.req.json()) as { promptId?: string };
    const promptId = typeof body.promptId === 'string' ? body.promptId.trim() : '';
    if (!promptId) return c.json({ status: 'error', message: 'promptId required' }, 400);
    const p = await getPrompt(promptId);
    if (!p) return c.json({ status: 'error', message: 'Prompt not found' }, 404);
    await updatePromptStatus(promptId, 'rejected');
    return c.json({ status: 'ok', message: 'Prompt rejected' });
  } catch (err) {
    console.error('Prompt admin reject error:', err);
    return c.json({ status: 'error', message: 'Failed to reject prompt' }, 500);
  }
});

/** POST /api/prompt/admin/select - Force-select a prompt (mod only) */
promptApi.post('/admin/select', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json<PromptAdminSelectResponse>(
        { status: 'error', message: 'You must be logged in' },
        401
      );
    }
    const isMod = await isModerator(username);
    if (!isMod) {
      return c.json<PromptAdminSelectResponse>(
        { status: 'error', message: 'Moderator access required' },
        403
      );
    }
    const body = (await c.req.json()) as { promptId?: string };
    const promptId = typeof body.promptId === 'string' ? body.promptId.trim() : '';
    if (!promptId) {
      return c.json<PromptAdminSelectResponse>({ status: 'error', message: 'promptId required' }, 400);
    }
    const p = await getPrompt(promptId);
    if (!p) {
      return c.json<PromptAdminSelectResponse>({ status: 'error', message: 'Prompt not found' }, 404);
    }
    const date = today();
    await updatePromptStatus(promptId, 'selected');
    await setCurrentDailyPromptForDate(date, p.text);
    await updatePromptStatus(promptId, 'used');
    return c.json<PromptAdminSelectResponse>({ status: 'ok', message: 'Prompt selected for today' });
  } catch (err) {
    console.error('Prompt admin select error:', err);
    return c.json<PromptAdminSelectResponse>({ status: 'error', message: 'Failed to select prompt' }, 500);
  }
});
