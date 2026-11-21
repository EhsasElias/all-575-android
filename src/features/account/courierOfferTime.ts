/**
 * A courier cannot accept an offer until the client has a synchronized clock,
 * or when the backend-provided deadline has passed.
 * The API remains authoritative for accepting or rejecting the offer.
 */
export function isExpiredCourierOffer(expiresAt: string | null, clockMs: number | null): boolean {
  if (clockMs === null) return true;
  if (expiresAt === null) return false;
  const expiresAtMs = Date.parse(expiresAt);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= clockMs;
}
