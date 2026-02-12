/**
 * Daily Draw Challenge - Post creation and winner comment
 * Creates custom posts with daily prompt in title; comments winners as app.
 */

import { context, reddit } from '@devvit/web/server';
import {
  getSubmission,
  getSubmissionIdsForDate,
  getVoteCount,
  getDailyPostId,
  setWinners,
  setDailyPost,
  incrementUserWins,
} from '../store/kv';
import { getPromptForDate } from '../store/kv';

/** Create a new daily challenge post with prompt in title */
export async function createDailyPost(prompt: string, date: string): Promise<{ id: string }> {
  const subredditName = context.subredditName ?? undefined;
  const title = `Daily Draw Challenge: ${prompt}`;
  const post = await reddit.submitCustomPost({
    subredditName,
    title,
    entry: 'game',
  });
  await setDailyPost(date, post.id);
  return { id: post.id };
}

/** Create a generic post (for menu "Create a new post" - uses current prompt) */
export async function createPost(): Promise<{ id: string }> {
  const date = new Date().toISOString().slice(0, 10);
  const prompt = await getPromptForDate(date);
  return createDailyPost(prompt, date);
}

/** Format winners comment body (markdown) */
function formatWinnersComment(
  date: string,
  winners: { rank: number; username: string; voteCount: number }[]
): string {
  const lines = [
    `## 🏆 Daily Draw Challenge – Winners (${date})`,
    '',
    '| Place | Artist | Votes |',
    '|:--|:--|:--|',
    ...winners.map((w) => `| ${w.rank} | u/${w.username} | ${w.voteCount} |`),
    '',
    'Great work everyone! See you tomorrow for the next prompt.',
  ];
  return lines.join('\n');
}

/** Close a day: compute top 3, save winners, increment win counts, comment on post */
export async function closeDayAndCommentWinners(date: string): Promise<void> {
  const ids = await getSubmissionIdsForDate(date);
  if (ids.length === 0) {
    return;
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
  const winnerIds: [string, string, string] = [
    top3[0]?.id ?? '',
    top3[1]?.id ?? '',
    top3[2]?.id ?? '',
  ];
  await setWinners(date, winnerIds);
  for (const w of top3) {
    if (w.sub) await incrementUserWins(w.sub.username);
  }
  const postId = await getDailyPostId(date);
  if (!postId) return;
  const winners = top3
    .filter((w) => w.sub)
    .map((w, i) => ({ rank: i + 1, username: w.sub!.username, voteCount: w.voteCount }));
  if (winners.length === 0) return;
  const body = formatWinnersComment(date, winners);
  await reddit.submitComment({
    id: postId as `t3_${string}`,
    text: body,
    runAs: 'APP',
  });
}
