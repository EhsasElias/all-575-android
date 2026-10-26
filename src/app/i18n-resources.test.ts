import { describe, expect, it } from 'vitest';
import { appResources } from './i18n-resources';

type Tree = { [key: string]: Tree | string };

function isTree(value: unknown): value is Tree {
  return typeof value === 'object' && value !== null;
}

/** Every text with its dotted path, so two languages can be compared key by key. */
function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const texts = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (typeof value === 'string') texts.set(path, value);
    else for (const [nested, text] of flatten(value, path)) texts.set(nested, text);
  }
  return texts;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/{{\s*(\w+)[^}]*}}/g)].map((match) => match[1] ?? '').sort();
}

function namespaces(language: 'en' | 'ar' | 'fr'): [string, Map<string, string>][] {
  return Object.entries(appResources[language]).map(([name, tree]) => [
    name,
    isTree(tree) ? flatten(tree) : new Map<string, string>(),
  ]);
}

describe('French texts', () => {
  const english = new Map(namespaces('en'));

  it.each(namespaces('fr'))('%s has every English key and no more', (name, french) => {
    expect([...french.keys()].sort()).toEqual([...(english.get(name)?.keys() ?? [])].sort());
  });

  it.each(namespaces('fr'))('%s keeps the same {{placeholders}} as English', (name, french) => {
    for (const [path, text] of french) {
      expect(placeholders(text), `${name}.${path}`).toEqual(
        placeholders(english.get(name)?.get(path) ?? ''),
      );
    }
  });

  it.each(namespaces('fr'))('%s has no empty text and no Arabic letters', (name, french) => {
    for (const [path, text] of french) {
      expect(text.trim(), `${name}.${path}`).not.toBe('');
      // Each language is named in its own script everywhere: the Arabic option reads العربية.
      if (path.startsWith('language.')) continue;
      expect(text, `${name}.${path}`).not.toMatch(/[\u0600-\u06FF]/);
    }
  });
});
