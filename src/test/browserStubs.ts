import { act } from '@testing-library/react';

// jsdom has no media queries. This stub lets tests switch prefers-reduced-motion on and off.

let reducedMotion = false;
const mediaListeners = new Set<EventListenerOrEventListenerObject>();

function createMediaQueryList(query: string): MediaQueryList {
  return {
    media: query,
    onchange: null,
    get matches() {
      return query.includes('prefers-reduced-motion') && reducedMotion;
    },
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      mediaListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      mediaListeners.delete(listener);
    },
    // The deprecated pair is still part of the MediaQueryList type.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    addListener: () => undefined,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
}

export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
  act(() => {
    for (const listener of mediaListeners) {
      if (typeof listener === 'function') listener(new Event('change'));
      else listener.handleEvent(new Event('change'));
    }
  });
}

export function installBrowserStubs(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => createMediaQueryList(query),
  });
}

export function resetBrowserStubs(): void {
  reducedMotion = false;
  mediaListeners.clear();
}
