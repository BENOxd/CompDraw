/**
 * Prompt submission UI - text input, char counter, submit button
 */

import type { FormEvent } from 'react';
import { useCallback, useState } from 'react';
const MIN = 5;
const MAX = 120;

type PromptSubmitProps = {
  onSubmit: (text: string) => Promise<boolean>;
  disabled?: boolean;
  hasSubmittedToday?: boolean;
};

export function PromptSubmit({
  onSubmit,
  disabled = false,
  hasSubmittedToday = false,
}: PromptSubmitProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = text.trim();
      setError(null);
      if (trimmed.length < MIN) {
        setError(`At least ${MIN} characters required`);
        return;
      }
      if (trimmed.length > MAX) {
        setError(`At most ${MAX} characters allowed`);
        return;
      }
      setLoading(true);
      const ok = await onSubmit(trimmed);
      setLoading(false);
      if (ok) {
        setText('');
      } else {
        setError('Submission failed');
      }
    },
    [text, onSubmit]
  );

  if (hasSubmittedToday) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <p className="text-gray-300 text-sm font-semibold mb-1">
          Topic submitted!
        </p>
        <p className="text-gray-500 text-xs">
          Come back tomorrow to submit another
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter a drawing topic idea (e.g. Draw your spirit animal)"
          className="w-full min-h-[120px] rounded-xl bg-gradient-to-br from-[#222] to-[#1a1a1a] border border-[#333]/50 px-4 py-3 text-gray-50 placeholder-gray-500 resize-none text-base focus:outline-none focus:ring-2 focus:ring-[#d93900]/50 focus:border-[#d93900] transition-all duration-200"
          maxLength={MAX}
          disabled={disabled || loading}
          aria-label="Topic text"
        />
        <div className="flex items-center justify-between mt-2 px-1">
          <p className={`text-xs font-medium transition-colors ${
            text.length < MIN ? 'text-gray-500' : text.length > MAX * 0.9 ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {text.length < MIN ? `${MIN - text.length} more needed` : 'Ready to submit'}
          </p>
          <p className="text-xs text-gray-500 font-semibold">
            {text.length}/{MAX}
          </p>
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={disabled || loading || text.trim().length < MIN}
        className="w-full min-h-[52px] rounded-xl bg-gradient-to-br from-[#d93900] to-[#b82e00] text-white font-semibold shadow-lg shadow-[#d93900]/30 hover:shadow-xl hover:shadow-[#d93900]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting…
          </span>
        ) : (
          'Submit topic'
        )}
      </button>
    </form>
  );
}
