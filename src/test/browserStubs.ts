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

/**
 * jsdom's Blob is missing the modern browser reading methods. Restore them
 * only in the test environment using its FileReader, so CSV download tests
 * exercise the app's normal Blob handling without changing production code.
 */
function installBlobReaders(): void {
  if (typeof Blob.prototype.arrayBuffer !== 'function') {
    Object.defineProperty(Blob.prototype, 'arrayBuffer', {
      configurable: true,
      value: function (this: Blob): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) resolve(reader.result);
            else reject(new Error('The blob reader did not return an ArrayBuffer'));
          };
          reader.onerror = () => {
            reject(reader.error ?? new Error('Could not read the blob'));
          };
          reader.readAsArrayBuffer(this);
        });
      },
    });
  }

  if (typeof Blob.prototype.text !== 'function') {
    Object.defineProperty(Blob.prototype, 'text', {
      configurable: true,
      value: async function (this: Blob): Promise<string> {
        return new TextDecoder().decode(await this.arrayBuffer());
      },
    });
  }
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

  installBlobReaders();
}

export function resetBrowserStubs(): void {
  reducedMotion = false;
  mediaListeners.clear();
}
