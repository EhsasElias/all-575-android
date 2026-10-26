import { isTestServerEnabled } from '@/shared/lib';
import { requestTracer } from './requestTrace';

/**
 * In a test build, a picture that did not load appears in the list of recent requests with its address, so a tester
 * can see whether the app asked for the right place (a picture's address is public; only its query is dropped).
 */
export function traceImageFailure(src: string): void {
  if (!isTestServerEnabled()) return;
  const address = src.split(/[?#]/)[0] ?? src;
  requestTracer.begin('IMG', address).failed('the picture did not load');
}
