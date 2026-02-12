/**
 * Daily Draw Challenge - Shared API types
 * Used by both client and server for type-safe API communication.
 */

/** Current prompt returned by GET /api/prompt */
export type PromptResponse = {
  prompt: string;
  date: string; // YYYY-MM-DD
};

/** Submit drawing request/response */
export type SubmitRequest = {
  imageBase64: string; // PNG data URL or raw base64
};

export type SubmitResponse =
  | { status: 'ok'; submissionId: string; message: string }
  | { status: 'error'; message: string };

/** Single submission (for gallery and leaderboard) */
export type Submission = {
  id: string;
  username: string;
  postId: string;
  date: string;
  timestamp: number;
  imageUrl: string; // base64 data URL or media URL
  voteCount: number;
  hasVoted?: boolean; // true if current user voted (when fetched with auth)
};

/** Submissions list response */
export type SubmissionsResponse =
  | { status: 'ok'; submissions: Submission[]; date: string }
  | { status: 'error'; message: string };

/** Vote request/response */
export type VoteRequest = {
  submissionId: string;
};

export type VoteResponse =
  | { status: 'ok'; voteCount: number }
  | { status: 'error'; message: string };

/** Leaderboard entry (top 3 with podium) */
export type LeaderboardEntry = {
  rank: 1 | 2 | 3;
  submissionId: string;
  username: string;
  voteCount: number;
  imageUrl: string;
};

export type LeaderboardResponse =
  | { status: 'ok'; entries: LeaderboardEntry[]; date: string }
  | { status: 'error'; message: string };

/** User profile (badges, wins) */
export type UserProfile = {
  username: string;
  winCount: number;
  badge: 'none' | 'bronze' | 'silver' | 'gold';
  hasSubmittedToday: boolean;
  date: string;
};

export type ProfileResponse =
  | { status: 'ok'; profile: UserProfile }
  | { status: 'error'; message: string };

/** Init response for app context (postId, username, prompt, etc.) */
export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  prompt: string;
  date: string;
  profile: UserProfile;
  hasSubmittedPromptToday?: boolean;
  isModerator?: boolean;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};

/** User-generated prompt idea (status: pending | selected | rejected | used) */
export type PromptIdeaStatus = 'pending' | 'selected' | 'rejected' | 'used';

export type PromptIdea = {
  id: string;
  text: string;
  createdBy: string;
  createdAt: number;
  voteCount: number;
  status: PromptIdeaStatus;
};

/** Prompt idea with client-only fields (hasVoted, effectiveVoteCount with winner bonus) */
export type PromptIdeaDisplay = PromptIdea & {
  hasVoted?: boolean;
  effectiveVoteCount?: number; // voteCount + creator's win bonus
};

export type PromptSubmitRequest = { text: string };
export type PromptSubmitResponse =
  | { status: 'ok'; promptId: string; message: string }
  | { status: 'error'; message: string };

export type PromptVoteRequest = { promptId: string };
export type PromptVoteResponse =
  | { status: 'ok'; voteCount: number }
  | { status: 'error'; message: string };

export type PromptListResponse =
  | { status: 'ok'; prompts: PromptIdeaDisplay[]; date: string }
  | { status: 'error'; message: string };

export type PromptTopResponse =
  | { status: 'ok'; prompt: PromptIdeaDisplay | null; date: string }
  | { status: 'error'; message: string };

export type PromptAdminSelectRequest = { promptId: string };
export type PromptAdminSelectResponse =
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string };

/** Default prompts rotated daily (index by day of year % length) */
export const DEFAULT_PROMPTS = [
  'Draw your spirit animal',
  'Draw something that makes you happy',
  'Draw your favorite food',
  'Draw a dream you had',
  'Draw your superpower',
  'Draw something under the sea',
  'Draw your ideal vacation',
  'Draw a robot friend',
  'Draw something cozy',
  'Draw a portal to another world',
];
