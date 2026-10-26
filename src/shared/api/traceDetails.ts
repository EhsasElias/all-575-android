import { ApiError } from './api-error';

const SNIPPET_LENGTH = 80;

/** "Name: message" of whatever was thrown (a DOMException is not always an Error), cut short. */
export function describeCause(cause: unknown): string {
  if (typeof cause === 'string') return cause.slice(0, 120);
  if (typeof cause === 'object' && cause !== null && 'name' in cause && 'message' in cause) {
    return `${String(cause.name)}: ${String(cause.message)}`.slice(0, 120);
  }
  return '';
}

/** What went wrong, for the test build's request log: the kind of failure and, if known, the cause underneath. */
export function describeFailure(error: unknown): { reason: string; note: string } {
  if (!(error instanceof ApiError)) return { reason: 'error', note: describeCause(error) };
  const reason = error.status === null ? error.kind : `${error.kind} ${error.status}`;
  return { reason, note: describeCause(error.cause) };
}

/** The start of an answer that was not valid JSON, so a tester can tell an HTML page from a server notice. */
export function describeReply(response: Response, text: string): string {
  const type = response.headers.get('Content-Type') ?? 'no content type';
  const start = text.replace(/\s+/g, ' ').trim().slice(0, SNIPPET_LENGTH);
  return `reply ${type}: "${start}"`;
}
