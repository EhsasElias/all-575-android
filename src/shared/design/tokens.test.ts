import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/test/contrast';
import { extractBlock, readCustomProperties } from '@/test/css';
import tokensCss from './tokens.css?raw';

const light = readCustomProperties(extractBlock(tokensCss, ':root {'));
const darkBySystem = readCustomProperties(
  extractBlock(
    extractBlock(tokensCss, '@media (prefers-color-scheme: dark)'),
    ":root:not([data-theme='light'])",
  ),
);
const darkByAttribute = readCustomProperties(extractBlock(tokensCss, ":root[data-theme='dark']"));

// The dark palette is stored twice (system preference and manual override).
const dark = new Map([...darkByAttribute]);

const THEMES = [
  ['light', light],
  ['dark', dark],
] as const;

const SURFACES = [
  'bg',
  'surface',
  'surface-mint',
  'surface-sunken',
  'bg-soft',
  'surface-pill',
] as const;

/** Text (4.5:1): [foreground token, background token]. */
const TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ...SURFACES.map((surface) => ['text', surface] as const),
  ...SURFACES.map((surface) => ['text-muted', surface] as const),
  ...SURFACES.map((surface) => ['brand-text', surface] as const),
  ...SURFACES.map((surface) => ['heading-accent', surface] as const),
  ['on-card', 'card-surface'],
  ['on-brand', 'brand'],
  ['on-brand', 'brand-pressed'],
  ['on-accent', 'accent'],
  ['danger', 'bg'],
  ['danger', 'surface'],
  ['danger', 'danger-surface'],
];

/** Large text and UI components (3:1): borders, focus ring, status icons, filled controls. */
const UI_PAIRS: readonly (readonly [string, string])[] = [
  ...SURFACES.map((surface) => ['border-strong', surface] as const),
  ...SURFACES.map((surface) => ['focus', surface] as const),
  ['brand', 'bg'],
  ['brand', 'bg-soft'],
  ['brand', 'surface'],
  ['accent', 'bg'],
  ['accent', 'surface'],
  ['success', 'surface'],
  ['success', 'surface-mint'],
];

function color(theme: Map<string, string>, token: string): string {
  const value = theme.get(`color-${token}`);
  if (value === undefined) throw new Error(`Missing token --color-${token}`);
  return value;
}

describe.each(THEMES)('%s theme contrast', (_name, theme) => {
  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (foreground, background) => {
    expect(
      contrastRatio(color(theme, foreground), color(theme, background)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s against %s is at least 3:1', (foreground, background) => {
    expect(
      contrastRatio(color(theme, foreground), color(theme, background)),
    ).toBeGreaterThanOrEqual(3);
  });

  it('checks every text token it defines', () => {
    const covered = new Set(TEXT_PAIRS.map(([foreground]) => foreground));
    const textTokens = [...theme.keys()]
      .filter((name) => /^color-(text|on-|brand-text|heading-accent)/.test(name))
      .map((name) => name.replace('color-', ''));
    expect(textTokens.filter((token) => !covered.has(token))).toEqual([]);
  });
});

describe('theme definitions', () => {
  it('defines the same tokens in light and dark', () => {
    const colorTokens = (theme: Map<string, string>) =>
      [...theme.keys()]
        .filter((name) => name.startsWith('color-') || name === 'shadow-raised')
        .sort();
    expect(colorTokens(dark)).toEqual(colorTokens(light));
  });

  it('keeps the system-preference and manual dark palettes identical', () => {
    for (const [name, value] of darkByAttribute) {
      if (name === 'color-scheme') continue;
      expect(darkBySystem.get(name), name).toBe(value);
    }
    expect(darkBySystem.size).toBe(darkByAttribute.size);
  });

  it('keeps the brand colors from the logo', () => {
    expect(light.get('color-brand')).toBe('#2b6b4f');
    expect(light.get('color-surface-mint')).toBe('#eef4ec');
    expect(light.get('color-accent')).toBe('#d62b2b');
  });
});

describe('non-color tokens', () => {
  it('uses a body text size of at least 16px', () => {
    expect(light.get('font-size-body')).toBe('1rem');
    const sizes = [...light].filter(([name]) => name.startsWith('font-size-'));
    for (const [name, value] of sizes) {
      expect(Number.parseFloat(value) * 16, name).toBeGreaterThanOrEqual(12);
    }
  });

  it('keeps every motion duration at or under 300ms', () => {
    const durations = [...light].filter(([name]) => name.startsWith('motion-'));
    expect(durations.length).toBeGreaterThan(0);
    for (const [name, value] of durations) {
      expect(Number.parseFloat(value), name).toBeLessThanOrEqual(300);
    }
  });

  it('orders the z-index scale from low to high', () => {
    const layers = [...light]
      .filter(([name]) => name.startsWith('z-'))
      .map(([, value]) => Number(value));
    expect(layers).toEqual([...layers].sort((a, b) => a - b));
  });

  it('keeps the touch target at 44px or more', () => {
    expect(Number.parseFloat(light.get('size-target') ?? '0')).toBeGreaterThanOrEqual(44);
  });
});
