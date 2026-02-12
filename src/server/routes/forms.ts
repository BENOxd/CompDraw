import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { setPromptOverride } from '../store/kv';

type ExampleFormValues = {
  message?: string;
};

type PromptOverrideValues = {
  prompt?: string;
};

export const forms = new Hono();

forms.post('/example-submit', async (c) => {
  const { message } = await c.req.json<ExampleFormValues>();
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  return c.json<UiResponse>(
    {
      showToast: trimmedMessage
        ? `Form says: ${trimmedMessage}`
        : 'Form submitted with no message',
    },
    200
  );
});

forms.post('/prompt-override', async (c) => {
  try {
    const { prompt } = await c.req.json<PromptOverrideValues>();
    const trimmed = typeof prompt === 'string' ? prompt.trim() : '';
    if (trimmed) {
      await setPromptOverride(trimmed);
      return c.json<UiResponse>({ showToast: { text: `Prompt set to: ${trimmed}`, appearance: 'success' } }, 200);
    }
    await setPromptOverride('');
    return c.json<UiResponse>({ showToast: { text: 'Prompt override cleared; using default rotation.', appearance: 'success' } }, 200);
  } catch (error) {
    console.error('Prompt override error:', error);
    return c.json<UiResponse>({ showToast: { text: 'Failed to set prompt', appearance: 'neutral' } }, 400);
  }
});
