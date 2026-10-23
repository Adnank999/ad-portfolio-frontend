import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageNotFound } from "@/components/feedback/PageNotFound";
import { getProject } from "@/data/projects";
import { TerrainProjectFallback } from "@/components/terrain-recreation/TerrainProjectFallback";
import { siteUrl } from "@/lib/siteUrl";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Project Not Found | Adnan Hossain Khan" }, { name: "robots", content: "noindex" }] };
    return {
    meta: [
      { title: `${loaderData.project.title} — Adnan Hossain Khan` },
      { name: "description", content: loaderData.project.description },
      {
        property: "og:title",
        content: `${loaderData.project.title} — Adnan Hossain Khan`,
      },
      { property: "og:description", content: loaderData.project.description },
      { property: "og:image", content: loaderData.project.image },
      { property: "og:type", content: "article" },
    ],
    links: [
      {
        rel: "canonical",
        href: siteUrl(`/projects/${loaderData.project.slug}`),
      },
    ],
    };
  },
  component: ProjectRoute,
  notFoundComponent: () => <PageNotFound collection="projects" />,
});
function ProjectRoute() {
  const { project } = Route.useLoaderData();
  return <TerrainProjectFallback project={project} />;
}
