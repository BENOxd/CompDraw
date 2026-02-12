/**
 * Basic profanity filter - blocklist of disallowed substrings.
 * Server-side validation only.
 */

const BLOCKLIST = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'crap',
  'dick',
  'cock',
  'pussy',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'rape',
  'kill',
  'murder',
  'hitler',
  'nazi',
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return BLOCKLIST.some((word) => lower.includes(word));
}
