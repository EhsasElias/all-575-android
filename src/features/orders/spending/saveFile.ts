import type { DateRange } from '../types';

const REVOKE_DELAY_MS = 1000;

/**
 * Hands a file to the browser's download flow through a temporary link, then frees the memory.
 * The blob is passed through untouched, so a UTF-8 byte-order mark is still its first bytes.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers start reading the blob a moment after the click, so the URL is revoked a little later.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, REVOKE_DELAY_MS);
}

/** The server's file name when it sent a usable one, otherwise one built from the period. */
export function csvFilename(fromHeader: string | null, range: DateRange): string {
  const cleaned = (fromHeader ?? '').replace(/[\\/:*?"<>|]|\p{Cc}/gu, '_').trim();
  if (cleaned === '' || cleaned.startsWith('.'))
    return `all575-spending-${range.from}-to-${range.to}.csv`;
  return cleaned.toLowerCase().endsWith('.csv') ? cleaned : `${cleaned}.csv`;
}
