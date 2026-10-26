import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearTrace, getTraceSnapshot, requestTracer, subscribeToTrace } from './requestTrace';

afterEach(() => {
  clearTrace();
});

describe('the request trace', () => {
  it('follows one request from getting ready to done', () => {
    const trace = requestTracer.begin('GET', '/categories');
    expect(getTraceSnapshot()).toMatchObject([
      { method: 'GET', path: '/categories', stage: 'preparing', endedAt: null },
    ]);

    trace.sending();
    expect(getTraceSnapshot()[0]).toMatchObject({ stage: 'sending', endedAt: null });

    trace.done(200);
    expect(getTraceSnapshot()[0]).toMatchObject({ stage: 'done', detail: '200' });
    expect(getTraceSnapshot()[0]?.endedAt).not.toBeNull();
  });

  it('records why a request failed and what went wrong while getting ready', () => {
    requestTracer.begin('POST', '/checkout').failed('timeout');
    const slow = requestTracer.begin('GET', '/store');
    slow.note('secure storage timeout');
    slow.sending();

    expect(getTraceSnapshot()).toMatchObject([
      { path: '/checkout', stage: 'failed', detail: 'timeout' },
      { path: '/store', stage: 'sending', note: 'secure storage timeout' },
    ]);
  });

  it('keeps only the latest twenty requests', () => {
    for (let index = 1; index <= 25; index++) requestTracer.begin('GET', `/p/${index}`);

    const paths = getTraceSnapshot().map((entry) => entry.path);
    expect(paths).toHaveLength(20);
    expect(paths[0]).toBe('/p/6');
    expect(paths[19]).toBe('/p/25');
  });

  it('tells subscribers about every change, and stops after they leave', () => {
    const listener = vi.fn();
    const leave = subscribeToTrace(listener);

    const trace = requestTracer.begin('GET', '/store');
    trace.done(200);
    expect(listener).toHaveBeenCalledTimes(2);

    leave();
    requestTracer.begin('GET', '/other');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('hands out a new list on each change, so a screen notices it', () => {
    const before = getTraceSnapshot();
    requestTracer.begin('GET', '/store');
    expect(getTraceSnapshot()).not.toBe(before);
  });
});
