import { describe, expect, it } from 'vitest';
import { findPhysicalCss } from '@/test/physicalCss';

// Every stylesheet in the app, as text.
const stylesheets = import.meta.glob<string>('/src/**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('logical CSS properties', () => {
  it('finds at least the stylesheets we expect', () => {
    expect(Object.keys(stylesheets).length).toBeGreaterThan(10);
  });

  it.each(Object.entries(stylesheets))(
    '%s uses no physical left/right properties',
    (_path, css) => {
      expect(findPhysicalCss(css)).toEqual([]);
    },
  );
});

describe('the physical CSS detector', () => {
  it.each([
    ['margin-left: 8px;', 'margin-left / margin-right'],
    ['margin-right:8px', 'margin-left / margin-right'],
    ['.a { padding-left: 4px }', 'padding-left / padding-right'],
    ['padding-right: 4px;', 'padding-left / padding-right'],
    ['.a { left: 0; }', 'left / right offset'],
    ['.a{position:absolute;right:0}', 'left / right offset'],
    ['text-align: left;', 'text-align: left / right'],
    ['text-align:right;', 'text-align: left / right'],
    ['border-left: 1px solid red;', 'border-left / border-right'],
    ['border-top-left-radius: 4px;', 'physical corner radius'],
    ['float: right;', 'float: left / right'],
    ['transform: translateX(10px);', 'translateX (does not flip in RTL)'],
    ['margin: 0 8px 0 16px;', 'four-value margin / padding (order is physical)'],
  ])('flags %s', (css, rule) => {
    expect(findPhysicalCss(css)).toContain(rule);
  });

  it.each([
    'margin-inline-start: 8px;',
    'padding-inline: 4px 8px;',
    'inset-inline-end: 0;',
    'text-align: start;',
    'border-inline-start: 1px solid red;',
    'border-start-start-radius: 4px;',
    'margin: 0 auto;',
    'padding: 4px 8px 12px;',
    'transform: scaleX(-1);',
    '/* margin-left: 0 is fine inside a comment */',
    '--safe-inline-start: env(safe-area-inset-left, 0px);',
  ])('accepts %s', (css) => {
    expect(findPhysicalCss(css)).toEqual([]);
  });
});
