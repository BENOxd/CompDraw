/**
 * Daily prompt selection logic
 * Find highest voted pending prompt, set as today's drawing prompt, mark as used.
 */

import {
  getPendingPromptIds,
  getPrompt,
  getPromptVoteCount,
  setCurrentDailyPromptForDate,
  updatePromptStatus,
} from './kv-prompts';
import { getUserWinCount } from './kv';
import { DEFAULT_PROMPTS } from '../../shared/api';

/** Select highest voted pending prompt for date; if none, use fallback */
export async function selectDailyPrompt(date: string): Promise<string> {
  const ids = await getPendingPromptIds();
  if (ids.length === 0) {
    return getFallbackPrompt(date);
  }
  const withVotes = await Promise.all(
    ids.map(async (id) => {
      const p = await getPrompt(id);
      if (!p || p.status !== 'pending') return null;
      const voteCount = await getPromptVoteCount(id);
      const winBonus = await getUserWinCount(p.createdBy);
      const effectiveCount = voteCount + winBonus;
      return { id, p, voteCount, effectiveCount };
    })
  );
  const valid = withVotes.filter((x): x is NonNullable<typeof x> => x != null);
  if (valid.length === 0) {
    return getFallbackPrompt(date);
  }
  valid.sort((a, b) => b.effectiveCount - a.effectiveCount);
  const winner = valid[0];
  if (!winner) return getFallbackPrompt(date);
  const text = winner.p.text;
  await updatePromptStatus(winner.id, 'selected');
  await setCurrentDailyPromptForDate(date, text);
  await updatePromptStatus(winner.id, 'used');
  return text;
}

function getFallbackPrompt(date: string): string {
  const dayOfYear = Math.floor(
    (new Date(date).getTime() - new Date(date.slice(0, 4) + '-01-01').getTime()) / 86400000
  );
  return DEFAULT_PROMPTS[dayOfYear % DEFAULT_PROMPTS.length] ?? 'Draw something amazing';
}
