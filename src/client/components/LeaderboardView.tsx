/**
 * Daily Draw Challenge - Leaderboard (top 3 podium)
 */

import type { LeaderboardEntry } from '../../shared/api';

type LeaderboardViewProps = {
  entries: LeaderboardEntry[];
  loading: boolean;
  date: string | null;
};

export function LeaderboardView({ entries, loading, date }: LeaderboardViewProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-end gap-4 h-48 animate-pulse">
        <div className="w-20 h-24 rounded-t-lg bg-[#333]" />
        <div className="w-20 h-32 rounded-t-lg bg-[#333]" />
        <div className="w-20 h-20 rounded-t-lg bg-[#333]" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 p-12 text-center">
        <div className="text-5xl mb-4 opacity-50">🏆</div>
        <p className="text-gray-300 font-semibold text-lg mb-2">No votes yet</p>
        <p className="text-gray-500 text-sm">Submit and vote to see the podium!</p>
      </div>
    );
  }

  const order = [2, 1, 3] as const;
  const byRank = Object.fromEntries(entries.map((e) => [e.rank, e]));

  return (
    <div className="space-y-6">
      {date && (
        <div className="text-center">
          <p className="text-sm text-gray-400 font-medium">Daily challenge</p>
          <p className="text-xs text-gray-500 mt-1">{date}</p>
        </div>
      )}
      <div className="flex justify-center items-end gap-3 sm:gap-6 pb-8">
        {order.map((rank) => {
          const entry = byRank[rank];
          if (!entry) return null;
          const heights = { 1: 'h-44', 2: 'h-52', 3: 'h-36' };
          const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
          const colors = { 1: 'from-yellow-500/20 to-yellow-600/10', 2: 'from-gray-400/20 to-gray-500/10', 3: 'from-orange-600/20 to-orange-700/10' };
          return (
            <div
              key={entry.submissionId}
              className={`flex flex-col items-center ${heights[rank]} justify-end transition-all duration-300 hover:scale-105`}
            >
              <span className="text-3xl mb-2 drop-shadow-lg">{medals[rank]}</span>
              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gradient-to-br ${colors[rank]} border-2 ${
                rank === 1 ? 'border-yellow-500/50' : rank === 2 ? 'border-gray-400/50' : 'border-orange-600/50'
              } flex-shrink-0 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                <img
                  src={entry.imageUrl}
                  alt={`#${rank} u/${entry.username}`}
                  className="w-full h-full object-contain bg-[#1a1a1a]"
                />
              </div>
              <p className="text-sm font-bold text-gray-100 mt-2 truncate max-w-[120px]">
                u/{entry.username}
              </p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{entry.voteCount} votes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
