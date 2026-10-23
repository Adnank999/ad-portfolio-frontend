import type { BlogSearch } from "./types";

export type { BlogArchive, BlogCategory, BlogCounts, BlogPost, BlogSearch, BlogSection, BlogSummary, PublishedBlogPost } from "./types";

export const blogCategories = [
  { id: "insights", label: "Insights" },
  { id: "growth", label: "Growth" },
  { id: "ai", label: "AI" },
  { id: "news", label: "News" },
] as const;

export function parseBlogSearch(search: Record<string, unknown>): BlogSearch {
  const parsed: BlogSearch = { category: undefined, view: undefined, sort: undefined };
  const category = blogCategories.find((entry) => entry.id === search.category);
  if (category) parsed.category = category.id;
  if (search.view === "list") parsed.view = "list";
  if (search.sort === "oldest") parsed.sort = "oldest";
  const page = Number(search.page);
  if (Number.isSafeInteger(page) && page > 1 && page <= 1_000_000) parsed.page = page;
  return parsed;
}

export function formatBlogDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
