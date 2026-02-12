/**
 * Daily Draw Challenge - API hooks
 * Fetches init, prompt, submissions, vote, leaderboard, profile.
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  InitResponse,
  LeaderboardResponse,
  SubmissionsResponse,
  SubmitResponse,
  UserProfile,
  VoteResponse,
} from '../../shared/api';

type InitState = {
  postId: string | null;
  username: string | null;
  prompt: string | null;
  date: string | null;
  profile: UserProfile | null;
  hasSubmittedPromptToday: boolean;
  isModerator: boolean;
  loading: boolean;
  error: string | null;
};

export function useInit() {
  const [state, setState] = useState<InitState>({
    postId: null,
    username: null,
    prompt: null,
    date: null,
    profile: null,
    hasSubmittedPromptToday: false,
    isModerator: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as InitResponse;
        if (data.type !== 'init') throw new Error('Unexpected response');
        if (cancelled) return;
        setState({
          postId: data.postId,
          username: data.username,
          prompt: data.prompt,
          date: data.date,
          profile: data.profile,
          hasSubmittedPromptToday: data.hasSubmittedPromptToday ?? false,
          isModerator: data.isModerator ?? false,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load',
          }));
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useSubmissions() {
  const [data, setData] = useState<SubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions');
      const json = (await res.json()) as SubmissionsResponse;
      setData(json);
    } catch {
      setData({ status: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      const json = (await res.json()) as LeaderboardResponse;
      setData(json);
    } catch {
      setData({ status: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

export function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (imageBase64: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const base64 = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const json = (await res.json()) as SubmitResponse;
      if (json.status === 'ok') return true;
      setError(json.message);
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}

export function useVote() {
  const [loading, setLoading] = useState<string | null>(null);

  const vote = useCallback(async (submissionId: string): Promise<boolean> => {
    setLoading(submissionId);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const json = (await res.json()) as VoteResponse;
      return json.status === 'ok';
    } finally {
      setLoading(null);
    }
  }, []);

  return { vote, loading };
}
