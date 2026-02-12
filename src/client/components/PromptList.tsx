/**
 * Prompt voting UI - list top prompts, upvote button
 */

import type { PromptIdeaDisplay } from '../../shared/api';

type PromptListProps = {
  prompts: PromptIdeaDisplay[];
  loading: boolean;
  onVote: (promptId: string) => Promise<boolean>;
  onRefresh: () => void;
  username: string | null;
  isMod?: boolean;
  onAdminSelect?: (promptId: string) => Promise<boolean>;
};

export function PromptList({
  prompts,
  loading,
  onVote,
  onRefresh,
  username,
  isMod = false,
  onAdminSelect,
}: PromptListProps) {
  const handleVote = async (p: PromptIdeaDisplay) => {
    if (p.createdBy === username || p.hasVoted || !username) return;
    const ok = await onVote(p.id);
    if (ok) void onRefresh();
  };

  const handleAdminSelect = async (p: PromptIdeaDisplay) => {
    if (!onAdminSelect || !isMod) return;
    const ok = await onAdminSelect(p.id);
    if (ok) void onRefresh();
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[#222]" />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 p-8 text-center">
        <div className="text-4xl mb-3 opacity-50">💡</div>
        <p className="text-gray-300 font-semibold mb-1">No topics yet</p>
        <p className="text-gray-500 text-sm">Be the first to submit!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((p, idx) => {
        const effectiveCount = p.effectiveVoteCount ?? p.voteCount;
        const canVote = username && p.createdBy !== username && !p.hasVoted;
        return (
          <div
            key={p.id}
            className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#222] to-[#1f1f1f] border border-[#333]/50 p-4 shadow-md hover:shadow-lg hover:border-[#444] transition-all duration-200 hover:scale-[1.01]"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-gray-50 text-sm font-semibold leading-snug">{p.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-xs text-gray-500">u/{p.createdBy}</p>
                {effectiveCount > p.voteCount && (
                  <span className="text-xs text-[#d93900] font-medium">+{effectiveCount - p.voteCount} bonus</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleVote(p)}
                disabled={!canVote}
                className={`min-h-[40px] min-w-[60px] rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  p.hasVoted
                    ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white shadow-md shadow-green-500/20'
                    : canVote
                      ? 'bg-gradient-to-br from-[#333] to-[#2a2a2a] text-gray-200 hover:from-[#3a3a3a] hover:to-[#333] hover:shadow-lg'
                      : 'bg-[#2a2a2a] text-gray-500 opacity-50 cursor-not-allowed'
                }`}
                aria-label={p.hasVoted ? 'You voted' : 'Upvote'}
              >
                {p.hasVoted ? '✓ ' : '↑ '}
                {effectiveCount}
              </button>
              {isMod && onAdminSelect && (
                <button
                  type="button"
                  onClick={() => handleAdminSelect(p)}
                  className="min-h-[40px] rounded-lg bg-gradient-to-br from-[#444] to-[#333] text-gray-200 text-xs font-semibold px-3 hover:from-[#555] hover:to-[#444] transition-all duration-200 active:scale-95 shadow-md"
                >
                  Select
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
