/**
 * Daily Draw Challenge - Splash (inline view in feed)
 * Tap to open expanded game.
 */

import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { requestExpandedMode } from '@devvit/web/client';
import { context } from '@devvit/web/client';

export const Splash = () => {
  return (
    <div className="relative flex flex-col justify-center items-center min-h-full gap-6 bg-gradient-to-br from-[#0d0d0d] via-[#1a0d0d] to-[#0d0d0d] text-gray-100 rounded-xl p-8 border border-[#222]/50 shadow-2xl overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#d93900]/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-[#3b82f6]/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#22c55e]/10 rounded-full blur-lg animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
      </div>

      {/* Animated emoji icons */}
      <div className="relative flex items-center justify-center gap-3 mb-2">
        <div className="text-4xl animate-bounce" aria-hidden style={{ animationDuration: '1.5s', animationDelay: '0s' }}>
          🎨
        </div>
        <div className="text-5xl animate-bounce" aria-hidden style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}>
          ✏️
        </div>
        <div className="text-4xl animate-bounce" aria-hidden style={{ animationDuration: '1.5s', animationDelay: '0.4s' }}>
          🖌️
        </div>
      </div>

      <div className="text-center space-y-3 relative z-10">
        <h1 className="text-4xl font-black bg-gradient-to-r from-[#d93900] via-[#ff4d00] to-[#ff6600] bg-clip-text text-transparent drop-shadow-lg tracking-tight">
          Draw to dominate.
        </h1>
        <h2 className="text-xl font-bold text-gray-300">
          Daily Draw Challenge
        </h2>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-[#d93900] animate-pulse" />
          <span>Daily competitions</span>
          <span className="w-2 h-2 rounded-full bg-[#d93900] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <p className="text-sm text-gray-300 font-medium max-w-xs">
          Draw today&apos;s topic • Vote for favorites • Win badges
        </p>
        {context.username && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Welcome back,</span>
            <span className="text-xs font-semibold text-[#d93900]">u/{context.username}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="relative min-h-[56px] px-10 rounded-full bg-gradient-to-br from-[#d93900] via-[#e04a00] to-[#b82e00] text-white font-bold text-base shadow-2xl shadow-[#d93900]/40 hover:shadow-[#d93900]/60 transition-all duration-300 active:scale-95 hover:scale-105 group overflow-hidden"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        <span className="relative z-10 flex items-center gap-2">
          <span>Tap to draw</span>
          <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </button>

      {/* Decorative elements */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span>🏆</span>
          <span>Win badges</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span>Daily prizes</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <span>🎯</span>
          <span>Vote & compete</span>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
