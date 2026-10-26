import { describe, expect, it } from 'vitest';
import { extractBlock, stripComments } from '@/test/css';
import homeSectionCss from './HomeSection.module.css?raw';

const css = stripComments(homeSectionCss);

describe('The home category strip', () => {
  const strip = extractBlock(css, '.strip {');

  it('still scrolls sideways, and snaps tiles into place', () => {
    expect(strip).toMatch(/overflow-x:\s*auto/);
    expect(strip).toMatch(/scroll-snap-type:\s*x\s+proximity/);
  });

  it('does not show a scrollbar, in any browser', () => {
    expect(strip).toMatch(/scrollbar-width:\s*none/);
    expect(extractBlock(css, '.strip::-webkit-scrollbar')).toMatch(/display:\s*none/);
  });

  it('does not pass the swipe on to the page when it reaches either end', () => {
    expect(strip).toMatch(/overscroll-behavior-inline:\s*contain/);
  });

  it('scrolls smoothly only for people who have not asked for less motion', () => {
    const reduced = extractBlock(css, '@media (prefers-reduced-motion: no-preference)');

    expect(reduced).toMatch(/scroll-behavior:\s*smooth/);
    expect(strip).not.toMatch(/(^|[\s;])scroll-behavior\s*:/);
  });
});
