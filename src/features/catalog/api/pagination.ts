export type CursorQuery = Record<string, string>;

/**
 * The query string of a `links.next` URL, or null when there is no next page. Only the query is used, never the
 * host, so the customer's token is only ever sent to our own API.
 */
export function nextPageQuery(next: string | null): CursorQuery | null {
  if (next === null || next === '') return null;
  try {
    const query = Object.fromEntries(new URL(next, 'https://api.invalid').searchParams);
    return Object.keys(query).length > 0 ? query : null;
  } catch {
    return null;
  }
}
