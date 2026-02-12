/**
 * Daily prompt display - highlight selected prompt, countdown until next selection
 */

import { useEffect, useState } from 'react';

type DailyPromptDisplayProps = {
  prompt: string | null;
  date: string | null;
  loading?: boolean;
};

function msUntilMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  ));
  return tomorrow.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function DailyPromptDisplay({
  prompt,
  date,
  loading = false,
}: DailyPromptDisplayProps) {
  const [countdown, setCountdown] = useState(formatCountdown(msUntilMidnightUTC()));

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilMidnightUTC()));
    const id = setInterval(tick, 60000);
    tick();
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-[#222] border border-[#333] p-4 animate-pulse">
        <div className="h-6 bg-[#333] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[#333] rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 p-5 space-y-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#444]">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#d93900] animate-pulse" />
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Today&apos;s topic</p>
      </div>
      <p className="text-xl font-bold text-gray-50 leading-tight">
        {prompt ?? 'Loading…'}
      </p>
      {date && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#333]/50">
          <p className="text-xs text-gray-500 font-medium">
            Next selection in: <span className="text-[#d93900] font-bold">{countdown}</span>
          </p>
          <span className="text-gray-600">·</span>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      )}
    </div>
  );
}
