import type { FunctionResponse } from './handler.js';

/** The day a Comment came in, as the owner in Rochester would date it. */
export const rochesterDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function text(status: number, message: string): FunctionResponse {
  return {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: message,
  };
}
