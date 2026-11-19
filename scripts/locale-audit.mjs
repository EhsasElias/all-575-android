#!/usr/bin/env node
/**
 * Reports screens with bilingual inline copy that can fall back to English in French.
 * Does not certify translations: server-owned text and dynamic values need separate QA.
 * Run: npm run locales:audit
 */
import { readdir, readFile, appendFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();

async function findFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findFiles(path)));
    else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec)\.tsx?$/.test(entry.name) &&
      !/\/locales(?:\.|\/)|\/dashboard\.(?:ar|en|fr)\./.test(path)
    )
      files.push(path);
  }
  return files;
}

const findings = [];
for (const file of await findFiles(join(root, 'src'))) {
  const source = await readFile(file, 'utf8');
  // Pure data resolvers (such as API-provided product names) are not UI copy.
  if (!file.endsWith('.tsx') && !/\b(?:const|let)\s+tr\s*=/.test(source)) continue;
  const usesBilingualTr = /\b(?:const|let)\s+tr\s*=/.test(source) && /\btr\(/.test(source);
  const hasFrenchChoice = /startsWith\(['"]fr['"]\)|\blanguage\s*===?\s*['"]fr['"]|\bfr\s*\?/.test(
    source,
  );
  const inlineArabic = (source.match(/\b(?:ar|arabic)\s*\?/g) ?? []).length;
  const calls = (source.match(/\btr\(/g) ?? []).length;
  if (!usesBilingualTr && inlineArabic === 0) continue;
  const hasFrenchDictionary = /French|frTranslations|french|locales\.fr|translations\.fr/i.test(
    source,
  );
  if (!hasFrenchChoice && !hasFrenchDictionary) {
    findings.push({ file: relative(root, file), calls, inlineArabic });
  }
}
findings.sort((a, b) => b.calls + b.inlineArabic - (a.calls + a.inlineArabic));
const summary = [
  '# French localization audit (source-level hints)',
  '',
  'This is a review queue, not a count of confirmed untranslated strings.',
  `Potential bilingual-only files: ${findings.length}`,
  '',
  ...findings.map(
    (item) => `- ${item.file}: ${item.calls} tr() uses, ${item.inlineArabic} Arabic-only branches`,
  ),
  '',
  'Translations returned by the API (such as seller and product names) must be audited separately.',
].join('\n');
process.stdout.write(summary + '\n');
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
}
