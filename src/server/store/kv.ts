/**
 * Daily Draw Challenge - KV Store schema and helpers
 * All keys are prefixed with ddc: (Daily Draw Challenge).
 * Redis is scoped per app installation (per subreddit).
 */

import { redis } from '@devvit/web/server';

const PREFIX = 'ddc:';

/** Current prompt text */
export const KEY_PROMPT_CURRENT = `${PREFIX}prompt:current`;
/** Date (YYYY-MM-DD) for which the prompt is active */
export const KEY_PROMPT_DATE = `${PREFIX}prompt:date`;
/** Admin override prompt (optional; takes precedence) */
export const KEY_PROMPT_OVERRIDE = `${PREFIX}prompt:override`;

/** Next submission ID (incremented) */
export const KEY_SUBMISSION_ID = `${PREFIX}submission:id`;
/** List of submission IDs for a date (JSON array) */
export const keySubmissionsForDate = (date: string) => `${PREFIX}submissions:${date}`;
/** Single submission data (JSON) */
export const keySubmission = (id: string) => `${PREFIX}submission:${id}`;
/** One submission per user per day (value = submissionId) */
export const keyUserSubmission = (username: string, date: string) =>
  `${PREFIX}user_sub:${username}:${date}`;

/** Voters for a submission (hash: voterUsername -> "1") */
export const keyVotes = (submissionId: string) => `${PREFIX}votes:${submissionId}`;
/** Rate limit: how many votes a user cast on a date */
export const keyUserVoteCount = (username: string, date: string) =>
  `${PREFIX}user_votes:${username}:${date}`;

/** Winners for a date (JSON [firstId, secondId, thirdId]) */
export const keyWinners = (date: string) => `${PREFIX}winners:${date}`;
/** Total wins per user (for badges) */
export const keyUserWins = (username: string) => `${PREFIX}user_wins:${username}`;

/** Map date -> postId for daily posts */
export const keyDailyPost = (date: string) => `${PREFIX}daily_post:${date}`;

/** Max votes per user per day (anti-spam) */
export const MAX_VOTES_PER_USER_PER_DAY = 50;

/** Max submission image size (base64 chars). ~500KB when decoded. */
export const MAX_IMAGE_BASE64_LENGTH = 680000;

export type StoredSubmission = {
  id: string;
  username: string;
  postId: string;
  date: string;
  timestamp: number;
  imageBase64: string;
};

export async function getPromptForDate(date: string): Promise<string> {
  const override = await redis.get(KEY_PROMPT_OVERRIDE);
  if (override != null && override !== '') return override;
  const { getCurrentDailyPromptForDate } = await import('./kv-prompts.js');
  const userPrompt = await getCurrentDailyPromptForDate(date);
  if (userPrompt != null && userPrompt !== '') return userPrompt;
  const current = await redis.get(KEY_PROMPT_CURRENT);
  if (current != null && current !== '') return current;
  // Fallback: use default prompts by day of year
  const dayOfYear = Math.floor(
    (new Date(date).getTime() - new Date(date.slice(0, 4) + '-01-01').getTime()) / 86400000
  );
  const { DEFAULT_PROMPTS } = await import('../../shared/api.js');
  return DEFAULT_PROMPTS[dayOfYear % DEFAULT_PROMPTS.length] ?? 'Draw something amazing';
}

export async function setPromptOverride(prompt: string): Promise<void> {
  await redis.set(KEY_PROMPT_OVERRIDE, prompt);
}

export async function setCurrentPrompt(prompt: string, date: string): Promise<void> {
  await redis.mSet({
    [KEY_PROMPT_CURRENT]: prompt,
    [KEY_PROMPT_DATE]: date,
  });
}

export async function getNextSubmissionId(): Promise<string> {
  const id = await redis.incrBy(KEY_SUBMISSION_ID, 1);
  return `s${id}`;
}

export async function saveSubmission(sub: StoredSubmission): Promise<void> {
  const listKey = keySubmissionsForDate(sub.date);
  const raw = await redis.get(listKey);
  const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  ids.push(sub.id);
  await redis.set(listKey, JSON.stringify(ids));
  await redis.set(keySubmission(sub.id), JSON.stringify(sub));
  await redis.set(keyUserSubmission(sub.username, sub.date), sub.id);
}

export async function getSubmission(id: string): Promise<StoredSubmission | null> {
  const raw = await redis.get(keySubmission(id));
  return raw ? (JSON.parse(raw) as StoredSubmission) : null;
}

export async function getSubmissionIdsForDate(date: string): Promise<string[]> {
  const raw = await redis.get(keySubmissionsForDate(date));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function getUserSubmissionForDate(
  username: string,
  date: string
): Promise<string | null> {
  return (await redis.get(keyUserSubmission(username, date))) ?? null;
}

export async function getVoteCount(submissionId: string): Promise<number> {
  const all = await redis.hGetAll(keyVotes(submissionId));
  return Object.keys(all).length;
}

export async function hasUserVoted(submissionId: string, username: string): Promise<boolean> {
  const v = await redis.hGet(keyVotes(submissionId), username);
  return v != null && v !== '';
}

export async function addVote(
  submissionId: string,
  username: string,
  date: string
): Promise<{ added: boolean; voteCount: number; error?: string }> {
  const countKey = keyUserVoteCount(username, date);
  const currentCount = await redis.get(countKey);
  const n = currentCount ? parseInt(currentCount, 10) : 0;
  if (n >= MAX_VOTES_PER_USER_PER_DAY) {
    return { added: false, voteCount: await getVoteCount(submissionId), error: 'Vote limit reached' };
  }
  const votesKey = keyVotes(submissionId);
  const existing = await redis.hGet(votesKey, username);
  if (existing != null && existing !== '') {
    return { added: false, voteCount: await getVoteCount(submissionId), error: 'Already voted' };
  }
  await redis.hSet(votesKey, { [username]: '1' });
  await redis.incrBy(countKey, 1);
  return { added: true, voteCount: await getVoteCount(submissionId) };
}

export async function getWinners(date: string): Promise<string[]> {
  const raw = await redis.get(keyWinners(date));
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function setWinners(date: string, submissionIds: [string, string, string]): Promise<void> {
  await redis.set(keyWinners(date), JSON.stringify(submissionIds));
}

export async function incrementUserWins(username: string): Promise<number> {
  return await redis.incrBy(keyUserWins(username), 1);
}

export async function getUserWinCount(username: string): Promise<number> {
  const raw = await redis.get(keyUserWins(username));
  return raw ? parseInt(raw, 10) : 0;
}

export async function setDailyPost(date: string, postId: string): Promise<void> {
  await redis.set(keyDailyPost(date), postId);
}

export async function getDailyPostId(date: string): Promise<string | null> {
  const id = await redis.get(keyDailyPost(date));
  return id ?? null;
}
