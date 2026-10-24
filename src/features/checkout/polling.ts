/** How long to wait before asking again: every 2 seconds at first, a little slower the longer it takes. */
export function pollDelayMs(pollsSoFar: number): number {
  const MAX_DELAY_MS = 8000;
  return Math.min(2000 + Math.floor(pollsSoFar / 5) * 1000, MAX_DELAY_MS);
}
