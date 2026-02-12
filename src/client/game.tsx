/**
 * Daily Draw Challenge - Main game (expanded view)
 * Draw, Gallery, Leaderboard, Profile. Mobile-first, dark mode.
 */

import './index.css';

import { StrictMode, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { showToast } from '@devvit/web/client';
import { DailyPromptDisplay } from './components/DailyPromptDisplay';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Gallery } from './components/Gallery';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { PromptList } from './components/PromptList';
import { PromptSubmit } from './components/PromptSubmit';
import { useInit, useSubmissions, useLeaderboard, useSubmit } from './hooks/useDailyDraw';
import {
  usePromptAdminSelect,
  usePromptList,
  usePromptSubmit,
  usePromptTop,
  usePromptVote,
} from './hooks/usePrompts';

type Tab = 'draw' | 'gallery' | 'leaderboard' | 'profile' | 'prompts';

export const App = () => {
  const init = useInit();
  const { data: submissionsData, loading: submissionsLoading, refetch: refetchSubmissions } = useSubmissions();
  const { data: leaderboardData, loading: leaderboardLoading, refetch: refetchLeaderboard } = useLeaderboard();
  const { submit, loading: submitLoading } = useSubmit();
  const { data: promptListData, loading: promptListLoading, refetch: refetchPrompts } = usePromptList();
  const { data: promptTopData, loading: promptTopLoading, refetch: refetchPromptTop } = usePromptTop();
  const { submit: submitPrompt } = usePromptSubmit();
  const { vote: votePrompt } = usePromptVote();
  const { select: adminSelectPrompt } = usePromptAdminSelect();
  const [tab, setTab] = useState<Tab>('draw');

  const canvasSize = useMemo(() => {
    const w = typeof window !== 'undefined' ? Math.min(window.innerWidth - 24, 480) : 400;
    const h = Math.min(w * 0.75, 360);
    return { width: Math.floor(w), height: Math.floor(h) };
  }, []);

  const handleExport = useCallback(
    async (dataUrl: string) => {
      const ok = await submit(dataUrl);
      if (ok) {
        showToast('Drawing submitted!');
        void refetchSubmissions();
        void refetchLeaderboard();
        setTab('gallery');
      } else {
        showToast('Submission failed. Try again.');
      }
    },
    [submit, refetchSubmissions, refetchLeaderboard]
  );

  const handlePromptSubmit = useCallback(
    async (text: string) => {
      const ok = await submitPrompt(text);
      if (ok) {
        showToast('Topic submitted!');
        void refetchPrompts();
        void refetchPromptTop();
      } else {
        showToast('Topic submission failed.');
      }
      return ok;
    },
    [submitPrompt, refetchPrompts, refetchPromptTop]
  );

  const submissions = submissionsData?.status === 'ok' ? submissionsData.submissions : [];
  const leaderboardEntries = leaderboardData?.status === 'ok' ? leaderboardData.entries : [];
  const leaderboardDate = leaderboardData?.status === 'ok' ? leaderboardData.date : null;
  const prompts = promptListData?.status === 'ok' ? promptListData.prompts : [];
  const promptTop = promptTopData?.status === 'ok' ? promptTopData.prompt : null;
  const promptDate = promptTopData?.status === 'ok' ? promptTopData.date : null;

  if (init.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#1a0d0d] text-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#d93900]/30 border-t-[#d93900] rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 font-medium animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (init.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#1a0d0d] text-gray-100 flex items-center justify-center p-4">
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 max-w-md text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-red-400 font-semibold">{init.error}</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'draw', label: 'Draw' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'prompts', label: 'Topics' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-100 flex flex-col">
      <header className="sticky top-0 z-10 bg-gradient-to-b from-[#0d0d0d] to-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#222]/50 px-4 py-4 shadow-lg">
        <h1 className="text-xl font-bold text-center truncate bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
          Daily Draw: {init.prompt ?? '…'}
        </h1>
        <p className="text-xs text-gray-400 text-center mt-1.5">
          {init.date ?? ''} · u/{init.username ?? 'anonymous'}
        </p>
      </header>

      <nav className="flex border-b border-[#222]/50 bg-[#1a1a1a]/50 backdrop-blur-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 min-h-[52px] text-sm font-semibold transition-all duration-200 relative ${
              tab === t.id
                ? 'bg-gradient-to-b from-[#d93900] to-[#b82e00] text-white shadow-lg shadow-[#d93900]/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#222]/50 active:scale-95'
            }`}
          >
            {tab === t.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
            )}
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4 pb-8">
        {tab === 'draw' && (
          <DrawingCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            onExport={handleExport}
            disabled={submitLoading || (init.profile?.hasSubmittedToday ?? false)}
          />
        )}
        {tab === 'gallery' && (
          <Gallery
            submissions={submissions}
            loading={submissionsLoading}
            onRefresh={refetchSubmissions}
            username={init.username}
          />
        )}
        {tab === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboardEntries}
            loading={leaderboardLoading}
            date={leaderboardDate}
          />
        )}
        {tab === 'prompts' && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <DailyPromptDisplay
              prompt={init.prompt ?? promptTop?.text ?? null}
              date={promptDate ?? init.date}
              loading={promptTopLoading}
            />
            <div className="rounded-xl bg-gradient-to-br from-[#1f1f1f] to-[#1a1a1a] border border-[#333]/50 p-5 shadow-lg">
              <h3 className="text-base font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-[#d93900] to-[#b82e00] rounded-full" />
                Submit a topic
              </h3>
              <PromptSubmit
                onSubmit={handlePromptSubmit}
                hasSubmittedToday={init.hasSubmittedPromptToday}
              />
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#1f1f1f] to-[#1a1a1a] border border-[#333]/50 p-5 shadow-lg">
              <h3 className="text-base font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-[#d93900] to-[#b82e00] rounded-full" />
                Vote on topics
              </h3>
              <PromptList
                prompts={prompts}
                loading={promptListLoading}
                onVote={votePrompt}
                onRefresh={refetchPrompts}
                username={init.username}
                isMod={init.isModerator}
                onAdminSelect={adminSelectPrompt}
              />
            </div>
          </div>
        )}
        {tab === 'profile' && <ProfileView profile={init.profile} />}
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
