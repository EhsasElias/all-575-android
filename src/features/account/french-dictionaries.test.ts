import { readFileSync } from 'node:fs';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { sellerStoreFrench } from './sellerStoreFrench';
import { sellerReviewFrench } from './sellerReviewFrench';
import { sellerProductsFrench } from './sellerProductsFrench';
import { sellerWorkspaceFrench } from './sellerWorkspaceFrench';
import { sellerInsightFrench } from './sellerInsightFrench';

const screens = [
  ['SellerStoreManagement.tsx', sellerStoreFrench],
  ['SellerReviewScreen.tsx', sellerReviewFrench],
  ['SellerProductManagement.tsx', sellerProductsFrench],
  ['SellerWorkspaceScreen.tsx', sellerWorkspaceFrench],
  ['SellerInsightPanel.tsx', sellerInsightFrench],
] as const;

function translatedEnglishLabels(file: string): string[] {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const labels = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'tr' &&
      node.arguments.length >= 2
    ) {
      const english = node.arguments[1];
      if (
        english !== undefined &&
        (ts.isStringLiteral(english) || ts.isNoSubstitutionTemplateLiteral(english))
      ) {
        labels.add(english.text);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(ast);
  return [...labels].sort();
}

describe('French seller/admin screen dictionaries', () => {
  for (const [file, dictionary] of screens) {
    it(`translates every literal label in ${file}`, () => {
      const labels = translatedEnglishLabels(file);
      expect(labels.length).toBeGreaterThan(0);
      const missing = labels.filter((label) => !dictionary[label]?.trim());
      expect(missing, `Missing French translations in ${file}`).toEqual([]);
    });
  }
});
