/**
 * Daily Draw Challenge - Scheduler (cron) handlers
 * Daily job: close previous day (winners, comment), set today's prompt, create today's post.
 */

import { Hono } from 'hono';
import type { TaskRequest, TaskResponse } from '@devvit/web/server';
import { closeDayAndCommentWinners } from '../core/post';
import { createDailyPost } from '../core/post';
import { setCurrentPrompt } from '../store/kv';
import { selectDailyPrompt } from '../store/prompt-selection';
export const scheduler = new Hono();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Cron: runs daily at 00:01 UTC. Close yesterday, create today. */
scheduler.post('/daily-rollover', async (c) => {
  try {
    await c.req.json<TaskRequest>();
    const prevDate = yesterday();
    const date = today();
    await closeDayAndCommentWinners(prevDate);
    const prompt = await selectDailyPrompt(date);
    await setCurrentPrompt(prompt, date);
    await createDailyPost(prompt, date);
    return c.json<TaskResponse>({ status: 'ok' }, 200);
  } catch (error) {
    console.error('Daily rollover error:', error);
    return c.json<TaskResponse>({ status: 'error' }, 500);
  }
});
