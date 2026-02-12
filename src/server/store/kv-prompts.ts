/**
 * User-generated prompt system - KV schema and helpers
 * Keys: prompt:{id}, prompts:pending, promptVotes:{id}, userPromptSubmission:{date}:{username},
 *       currentDailyPrompt:{date}, promptIdCounter
 */

import { redis } from '@devvit/web/server';
import type { PromptIdea, PromptIdeaStatus } from '../../shared/api';

const PREFIX = 'ddc:';

/** Next prompt idea ID */
const KEY_PROMPT_ID = `${PREFIX}promptIdCounter`;
/** Single prompt data (JSON) */
export const keyPrompt = (id: string) => `${PREFIX}prompt:${id}`;
/** List of pending prompt IDs (JSON array) */
const KEY_PROMPTS_PENDING = `${PREFIX}prompts:pending`;
/** Voters for a prompt (hash: voterUsername -> "1") */
export const keyPromptVotes = (id: string) => `${PREFIX}promptVotes:${id}`;
/** One prompt submission per user per day */
export const keyUserPromptSubmission = (username: string, date: string) =>
  `${PREFIX}userPromptSub:${username}:${date}`;
/** Daily prompt for date (stores prompt text) */
export const keyCurrentDailyPrompt = (date: string) =>
  `${PREFIX}currentDailyPrompt:${date}`;
/** Rate limit: prompt votes per user per day */
const keyUserPromptVoteCount = (username: string, date: string) =>
  `${PREFIX}userPromptVotes:${username}:${date}`;

export const MAX_PROMPT_VOTES_PER_USER_PER_DAY = 30;
export const PROMPT_MIN_LENGTH = 5;
export const PROMPT_MAX_LENGTH = 120;

export type StoredPromptIdea = Omit<PromptIdea, 'voters'>;

export async function getNextPromptId(): Promise<string> {
  const id = await redis.incrBy(KEY_PROMPT_ID, 1);
  return `p${id}`;
}

export async function savePrompt(prompt: StoredPromptIdea): Promise<void> {
  await redis.set(keyPrompt(prompt.id), JSON.stringify(prompt));
  if (prompt.status === 'pending') {
    const raw = await redis.get(KEY_PROMPTS_PENDING);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(prompt.id)) {
      ids.push(prompt.id);
      await redis.set(KEY_PROMPTS_PENDING, JSON.stringify(ids));
    }
  }
}

export async function getPrompt(id: string): Promise<StoredPromptIdea | null> {
  const raw = await redis.get(keyPrompt(id));
  return raw ? (JSON.parse(raw) as StoredPromptIdea) : null;
}

export async function updatePromptStatus(
  id: string,
  status: PromptIdeaStatus
): Promise<void> {
  const p = await getPrompt(id);
  if (!p) return;
  const updated = { ...p, status };
  await redis.set(keyPrompt(id), JSON.stringify(updated));
  if (status !== 'pending') {
    const raw = await redis.get(KEY_PROMPTS_PENDING);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]).filter((x) => x !== id) : [];
    await redis.set(KEY_PROMPTS_PENDING, JSON.stringify(ids));
  }
}

export async function getPendingPromptIds(): Promise<string[]> {
  const raw = await redis.get(KEY_PROMPTS_PENDING);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function getPromptVoteCount(id: string): Promise<number> {
  const all = await redis.hGetAll(keyPromptVotes(id));
  return Object.keys(all).length;
}

export async function hasUserVotedOnPrompt(
  promptId: string,
  username: string
): Promise<boolean> {
  const v = await redis.hGet(keyPromptVotes(promptId), username);
  return v != null && v !== '';
}

export async function addPromptVote(
  promptId: string,
  username: string,
  date: string
): Promise<{ added: boolean; voteCount: number; error?: string }> {
  const countKey = keyUserPromptVoteCount(username, date);
  const currentCount = await redis.get(countKey);
  const n = currentCount ? parseInt(currentCount, 10) : 0;
  if (n >= MAX_PROMPT_VOTES_PER_USER_PER_DAY) {
    return {
      added: false,
      voteCount: await getPromptVoteCount(promptId),
      error: 'Vote limit reached',
    };
  }
  const votesKey = keyPromptVotes(promptId);
  const existing = await redis.hGet(votesKey, username);
  if (existing != null && existing !== '') {
    return {
      added: false,
      voteCount: await getPromptVoteCount(promptId),
      error: 'Already voted',
    };
  }
  await redis.hSet(votesKey, { [username]: '1' });
  await redis.incrBy(countKey, 1);
  const newCount = await getPromptVoteCount(promptId);
  return { added: true, voteCount: newCount };
}

export async function getUserPromptSubmissionForDate(
  username: string,
  date: string
): Promise<string | null> {
  return (await redis.get(keyUserPromptSubmission(username, date))) ?? null;
}

export async function setUserPromptSubmission(
  username: string,
  date: string,
  promptId: string
): Promise<void> {
  await redis.set(keyUserPromptSubmission(username, date), promptId);
}

export async function getCurrentDailyPromptForDate(
  date: string
): Promise<string | null> {
  const raw = await redis.get(keyCurrentDailyPrompt(date));
  return raw ?? null;
}

export async function setCurrentDailyPromptForDate(
  date: string,
  promptText: string
): Promise<void> {
  await redis.set(keyCurrentDailyPrompt(date), promptText);
}

/** Remove prompt from pending list and optionally delete */
export async function removePromptFromPending(id: string): Promise<void> {
  const raw = await redis.get(KEY_PROMPTS_PENDING);
  const ids: string[] = raw ? (JSON.parse(raw) as string[]).filter((x) => x !== id) : [];
  await redis.set(KEY_PROMPTS_PENDING, JSON.stringify(ids));
}
