import { stripComments } from './css';

const FOUR_VALUES = String.raw`[^;\s]+\s+[^;\s]+\s+[^;\s]+\s+[^;\s]+`;

const RULES: readonly { name: string; pattern: RegExp }[] = [
  { name: 'margin-left / margin-right', pattern: /\bmargin-(left|right)\s*:/ },
  { name: 'padding-left / padding-right', pattern: /\bpadding-(left|right)\s*:/ },
  { name: 'left / right offset', pattern: /(^|[\s;{])(left|right)\s*:/ },
  { name: 'text-align: left / right', pattern: /text-align\s*:\s*(left|right)\b/ },
  { name: 'border-left / border-right', pattern: /\bborder-(left|right)(-[a-z]+)?\s*:/ },
  { name: 'physical corner radius', pattern: /\bborder-(top|bottom)-(left|right)-radius\s*:/ },
  { name: 'float: left / right', pattern: /\bfloat\s*:\s*(left|right)\b/ },
  { name: 'translateX (does not flip in RTL)', pattern: /translateX\(/ },
  {
    name: 'four-value margin / padding (order is physical)',
    pattern: new RegExp(String.raw`(^|[\s;{])(margin|padding)\s*:\s*${FOUR_VALUES}\s*[;}]`),
  },
];

/** Names of the physical (direction-dependent) CSS patterns found in `css`. */
export function findPhysicalCss(css: string): string[] {
  const source = stripComments(css);
  return RULES.filter((rule) => rule.pattern.test(source)).map((rule) => rule.name);
}
