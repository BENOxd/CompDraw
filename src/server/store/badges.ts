/**
 * Badge tiers: Bronze (1), Silver (3), Gold (5) wins.
 */

export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold';

export function getBadgeForWinCount(winCount: number): BadgeTier {
  if (winCount >= 5) return 'gold';
  if (winCount >= 3) return 'silver';
  if (winCount >= 1) return 'bronze';
  return 'none';
}
