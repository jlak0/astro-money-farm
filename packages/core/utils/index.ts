import type { CategoryConfigEntry, CategoryLinkConfig, SiteConfig } from '../config';

// Utility functions
export const formatDate = (date: Date) => date.toISOString().split('T')[0];
export const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-');

export interface CategoryLink {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  count?: number;
}

interface CategorizedPost {
  data: {
    category?: string;
  };
}

function countCategories(posts: CategorizedPost[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const category = post.data.category?.trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return counts;
}

function sortCategoryNames(counts: Map<string, number>) {
  return [...counts.entries()]
    .sort(([nameA, countA], [nameB, countB]) => {
      if (countA !== countB) return countB - countA;
      return nameA.localeCompare(nameB);
    })
    .map(([name]) => name);
}

function normalizeCategoryConfig(entry: CategoryConfigEntry): CategoryLinkConfig {
  return typeof entry === 'string' ? { name: entry } : entry;
}

function buildCategoryLink(
  entry: CategoryConfigEntry,
  config: SiteConfig,
  counts: Map<string, number>
): CategoryLink | null {
  const category = normalizeCategoryConfig(entry);
  const name = category.name.trim();
  if (!name) return null;

  const meta = config.categoryMeta?.[name] || {};

  return {
    name,
    slug: category.slug || meta.slug || name,
    description: category.description || meta.description,
    icon: category.icon || meta.icon,
    count: counts.get(name)
  };
}

export function deriveCategoryLinks(
  posts: CategorizedPost[],
  config: SiteConfig,
  options: {
    entries?: CategoryConfigEntry[];
    limit?: number;
  } = {}
) {
  const counts = countCategories(posts);
  const sourceEntries = options.entries?.length
    ? options.entries
    : sortCategoryNames(counts);

  return sourceEntries
    .map((entry) => buildCategoryLink(entry, config, counts))
    .filter((category): category is CategoryLink => Boolean(category))
    .slice(0, options.limit ?? 4);
}
