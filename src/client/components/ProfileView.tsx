/**
 * Daily Draw Challenge - Profile (badges, win count)
 */

import type { UserProfile } from '../../shared/api';

type ProfileViewProps = {
  profile: UserProfile | null;
};

const BADGE_LABELS: Record<UserProfile['badge'], string> = {
  none: 'No badge yet',
  bronze: 'Bronze (1 win)',
  silver: 'Silver (3 wins)',
  gold: 'Gold (5 wins)',
};

const BADGE_EMOJI: Record<UserProfile['badge'], string> = {
  none: '✨',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

export function ProfileView({ profile }: ProfileViewProps) {
  if (!profile) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 p-6 space-y-5 shadow-xl">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-transform duration-300 hover:scale-110 ${
            profile.badge === 'gold' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30' :
            profile.badge === 'silver' ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/10 border-2 border-gray-400/30' :
            profile.badge === 'bronze' ? 'bg-gradient-to-br from-orange-600/20 to-orange-700/10 border-2 border-orange-600/30' :
            'bg-[#333] border-2 border-[#444]'
          }`}
          aria-hidden
        >
          {BADGE_EMOJI[profile.badge]}
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-50">u/{profile.username}</p>
          <p className="text-sm text-gray-400 font-medium mt-1">{BADGE_LABELS[profile.badge]}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold text-[#d93900]">{profile.winCount}</span>
            <span className="text-xs text-gray-500">total wins</span>
          </div>
        </div>
      </div>
      {profile.hasSubmittedToday && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
          <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>You submitted today</span>
          </p>
        </div>
      )}
    </div>
  );
}
