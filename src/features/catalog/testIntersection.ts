import { vi } from 'vitest';

/**
 * jsdom has no IntersectionObserver. This fake lets a test scroll the end of a list into view by hand
 * (`reachEnd`), and see whether an observer is still watching.
 */
export function installFakeIntersectionObserver() {
  const created: FakeIntersectionObserver[] = [];

  class FakeIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    disconnected = false;
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      created.push(this);
    }

    observe = () => undefined;
    unobserve = () => undefined;
    takeRecords = () => [];
    disconnect = () => {
      this.disconnected = true;
    };

    intersect() {
      const rect = document.body.getBoundingClientRect();
      this.callback(
        [
          {
            boundingClientRect: rect,
            intersectionRatio: 1,
            intersectionRect: rect,
            isIntersecting: true,
            rootBounds: null,
            target: document.body,
            time: 0,
          },
        ],
        this,
      );
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

  const watching = () => created.filter((observer) => !observer.disconnected);
  return {
    activeCount: () => watching().length,
    reachEnd: () => {
      for (const observer of watching()) observer.intersect();
    },
  };
}
