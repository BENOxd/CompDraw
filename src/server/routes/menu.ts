import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});

/** Show form to override today's prompt (mod only) */
menu.post('/prompt-override', async (c) => {
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'promptOverride',
        form: {
          title: 'Override daily prompt',
          description: 'Set the prompt for today. Leave empty to use the default rotation.',
          fields: [
            {
              type: 'string',
              name: 'prompt',
              label: 'Today\'s prompt',
              helpText: 'e.g. "Draw your spirit animal"',
            },
          ],
          acceptLabel: 'Save',
          cancelLabel: 'Cancel',
        },
      },
    },
    200
  );
});
