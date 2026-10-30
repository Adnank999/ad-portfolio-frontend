import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PageNotFound } from "@/components/feedback/PageNotFound";
import { projectOptions, projectsOptions } from '@/queries/projects/projects';
import { useSuspenseQuery } from '@tanstack/react-query';
import { TerrainProjectFallback } from "@/components/terrain-recreation/TerrainProjectFallback";
import { siteUrl } from "@/lib/siteUrl";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params, context }) => {
    const [result] = await Promise.all([
      context.queryClient.fetchQuery(projectOptions(params.slug)),
      context.queryClient.fetchQuery(projectsOptions()),
    ]);
    if (!result) throw notFound();
    if (result.project.slug !== params.slug) throw redirect({ to: '/projects/$slug', params: { slug: result.project.slug }, statusCode: 308 });
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Project Not Found | Adnan Hossain Khan" }, { name: "robots", content: "noindex" }] };
    return {
    meta: [
      { title: loaderData.seo?.title || `${loaderData.project.title} — Adnan Hossain Khan` },
      { name: "description", content: loaderData.seo?.description || loaderData.project.description },
      {
        property: "og:title",
        content: `${loaderData.project.title} — Adnan Hossain Khan`,
      },
      { property: "og:description", content: loaderData.project.description },
      { property: "og:image", content: loaderData.seo?.ogImage || loaderData.seo?.socialImage || loaderData.project.featuredImageUrl || loaderData.project.image },
      ...(loaderData.seo?.noIndex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
      { property: "og:type", content: "article" },
    ],
    links: [
      {
        rel: "canonical",
        href: loaderData.seo?.canonicalUrl || siteUrl(`/projects/${loaderData.project.slug}`),
      },
    ],
    };
  },
  component: ProjectRoute,
  preloadStaleTime: 0,
  notFoundComponent: () => <PageNotFound collection="projects" />,
});
function ProjectRoute() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(projectOptions(slug));
  return data ? <TerrainProjectFallback project={data.project} /> : <PageNotFound collection="projects" />;
}
