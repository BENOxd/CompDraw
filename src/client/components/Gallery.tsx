/**
 * Daily Draw Challenge - Gallery (submissions grid, tap to zoom)
 */

import { useCallback, useState } from 'react';
import type { Submission } from '../../shared/api';
import { useVote } from '../hooks/useDailyDraw';

type GalleryProps = {
  submissions: Submission[];
  loading: boolean;
  onRefresh: () => void;
  username: string | null;
};

export function Gallery({ submissions, loading, onRefresh, username }: GalleryProps) {
  const [zoomed, setZoomed] = useState<Submission | null>(null);
  const { vote, loading: voteLoading } = useVote();

  const handleVote = useCallback(
    async (sub: Submission) => {
      if (sub.username === username || sub.hasVoted) return;
      const ok = await vote(sub.id);
      if (ok) onRefresh();
    },
    [username, vote, onRefresh]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-[#333]" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 p-12 text-center">
        <div className="text-5xl mb-4 opacity-50">🎨</div>
        <p className="text-gray-300 font-semibold text-lg mb-2">No submissions yet</p>
        <p className="text-gray-500 text-sm">Be the first to draw!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="group rounded-xl overflow-hidden bg-gradient-to-br from-[#222] to-[#1f1f1f] border border-[#333]/50 shadow-md hover:shadow-xl hover:border-[#444] transition-all duration-300 hover:scale-[1.02]"
          >
            <button
              type="button"
              className="block w-full aspect-square overflow-hidden relative"
              onClick={() => setZoomed(sub)}
              aria-label="Zoom"
            >
              <img
                src={sub.imageUrl}
                alt={`Drawing by ${sub.username}`}
                className="w-full h-full object-contain bg-[#1a1a1a] transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <div className="p-3 flex items-center justify-between gap-2 bg-[#1f1f1f]">
              <span className="text-sm text-gray-300 truncate font-medium">u/{sub.username}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(sub);
                  }}
                  disabled={
                    !username ||
                    sub.username === username ||
                    sub.hasVoted ||
                    voteLoading === sub.id
                  }
                  className={`min-h-[36px] min-w-[56px] rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    sub.hasVoted
                      ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white shadow-md shadow-green-500/20'
                      : !username || sub.username === username || voteLoading === sub.id
                        ? 'bg-[#2a2a2a] text-gray-500 opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#333] to-[#2a2a2a] text-gray-200 hover:from-[#3a3a3a] hover:to-[#333] hover:shadow-lg'
                  }`}
                  aria-label="Vote"
                >
                  {sub.hasVoted ? '✓ ' : '↑ '}
                  {sub.voteCount}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setZoomed(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setZoomed(null)}
          aria-label="Close"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setZoomed(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-2xl font-bold w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
            <img
              src={zoomed.imageUrl}
              alt={`Drawing by ${zoomed.username}`}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl">
              <p className="text-white font-semibold">u/{zoomed.username}</p>
              <p className="text-white/80 text-sm">{zoomed.voteCount} votes</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
