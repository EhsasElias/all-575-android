import type { TFunction } from 'i18next';

/** A screen's browser title, written as a function of `t` so every key is checked at compile time. */
export class PageTitle {
  readonly resolve: (t: TFunction) => string;

  constructor(resolve: (t: TFunction) => string) {
    this.resolve = resolve;
  }
}

/**
 * A route sets its browser title with `handle: titled((t) => t('orders:detail.title'))`, using a key from its
 * own feature's locale file (common keys need no prefix, e.g. `t('nav.home')`). A mistyped key fails to compile.
 */
export function titled(resolve: (t: TFunction) => string): PageTitle {
  return new PageTitle(resolve);
}
