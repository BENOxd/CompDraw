/**
 * User-generated prompt system - API hooks
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  PromptAdminSelectResponse,
  PromptListResponse,
  PromptSubmitResponse,
  PromptTopResponse,
  PromptVoteResponse,
} from '../../shared/api';

export function usePromptList() {
  const [data, setData] = useState<PromptListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompt/list');
      const json = (await res.json()) as PromptListResponse;
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

export function usePromptTop() {
  const [data, setData] = useState<PromptTopResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompt/top');
      const json = (await res.json()) as PromptTopResponse;
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

export function usePromptSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (text: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/prompt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json()) as PromptSubmitResponse;
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

export function usePromptVote() {
  const [loading, setLoading] = useState<string | null>(null);

  const vote = useCallback(async (promptId: string): Promise<boolean> => {
    setLoading(promptId);
    try {
      const res = await fetch('/api/prompt/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
      const json = (await res.json()) as PromptVoteResponse;
      return json.status === 'ok';
    } finally {
      setLoading(null);
    }
  }, []);

  return { vote, loading };
}

export function usePromptAdminSelect() {
  const [loading, setLoading] = useState(false);

  const select = useCallback(async (promptId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompt/admin/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId }),
      });
      const json = (await res.json()) as PromptAdminSelectResponse;
      return json.status === 'ok';
    } finally {
      setLoading(false);
    }
  }, []);

  return { select, loading };
}
