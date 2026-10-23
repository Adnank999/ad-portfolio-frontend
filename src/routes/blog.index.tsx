import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BlogIndexPage } from "@/components/blog/blog-index/BlogIndexPage";
import { parseBlogSearch } from "@/data/blog";
import { blogIndexHead } from "@/lib/blogSeo";
import { blogArchiveOptions, blogCountsOptions } from "@/queries/blog/blog";
import { BlogLoadError, BlogPending } from "@/components/blog/blog-feedback/BlogFeedback";

export const Route = createFileRoute("/blog/")({
  validateSearch: parseBlogSearch,
  loaderDeps: ({ search: { category, sort, page } }) => ({ category, sort, page }),
  loader: async ({ context, deps }) => {
    const [archive, counts] = await Promise.all([
      context.queryClient.fetchQuery(blogArchiveOptions(deps)),
      context.queryClient.fetchQuery(blogCountsOptions()),
    ]);
    if ((deps.page ?? 1) > Math.max(1, archive.pagination.totalPages)) throw redirect({ to: '/blog', search: { ...deps, page: undefined }, replace: true });
    return { archive, counts };
  },
  preloadStaleTime: 0,
  head: ({ loaderData, match }) => loaderData ? blogIndexHead(loaderData.archive, match.search) : { meta: [{ title: 'Journal unavailable | Adnan Hossain Khan' }, { name: 'robots', content: 'noindex' }] },
  component: BlogIndexRoute,
  pendingComponent: BlogPending,
  errorComponent: BlogLoadError,
});

function BlogIndexRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const deps = Route.useLoaderDeps();
  const { data: archive } = useSuspenseQuery(blogArchiveOptions(deps));
  const { data: counts } = useSuspenseQuery(blogCountsOptions());
  return <BlogIndexPage archive={archive} counts={counts} search={search} onSearchChange={(change) => { void navigate({ search: (previous) => ({ ...previous, ...change }), replace: true, resetScroll: false }); }} />;
}
