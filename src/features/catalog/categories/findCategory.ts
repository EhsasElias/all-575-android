import type { Category } from '../api/types';

export type CategoryMatch = {
  category: Category;
  /** Set when the category is a sub-category. */
  parent: Category | null;
};

/** Looks a slug up in the category tree, at the top level and one level down. */
export function findCategory(tree: readonly Category[], slug: string): CategoryMatch | null {
  for (const category of tree) {
    if (category.slug === slug) return { category, parent: null };
    const child = category.children?.find((candidate) => candidate.slug === slug);
    if (child) return { category: child, parent: category };
  }
  return null;
}
