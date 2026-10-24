/** Returns the text between the braces that follow `header`, handling nested blocks. */
export function extractBlock(css: string, header: string): string {
  const start = css.indexOf(header);
  if (start === -1) throw new Error(`Block not found: ${header}`);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) return css.slice(open + 1, index);
  }
  throw new Error(`Unclosed block: ${header}`);
}

/** Custom property declarations of a block, by name without the leading dashes. */
export function readCustomProperties(block: string): Map<string, string> {
  const properties = new Map<string, string>();
  for (const match of block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) properties.set(name, value.trim());
  }
  return properties;
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}
