import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PageNotFound } from "@/components/feedback/PageNotFound";
import { getIndustry } from "@/data/case-studies";
import { caseStudyOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyLoadError, CaseStudyPending } from "@/components/case-studies/feedback/CaseStudyFeedback";
import { CaseStudyPage } from "@/components/global/case-study-page/CaseStudyPage";
import { caseStudyHead } from "@/lib/caseStudySeo";

export const Route = createFileRoute("/case-studies/$slug")({
  loader: async ({ params, context }) => {
    const study = await context.queryClient.fetchQuery(caseStudyOptions(params.slug));
    if (!study) throw notFound();
    if (study.slug !== params.slug) throw redirect({ to: '/case-studies/$slug', params: { slug: study.slug }, statusCode: 308 });
    const industry = getIndustry(study.industry);
    if (!industry) throw notFound();
    return { study, industry };
  },
  head: ({ loaderData }) => loaderData ? caseStudyHead(loaderData.study, loaderData.industry) : {
    meta: [{ title: "Case Study Not Found | Adnan Hossain Khan" }, { name: "robots", content: "noindex" }],
  },
  component: CaseStudyRoute,
  preloadStaleTime: 0,
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
  notFoundComponent: () => <PageNotFound collection="case-studies" />,
});

function CaseStudyRoute() {
  const { study } = Route.useLoaderData();
  return <CaseStudyPage study={study} />;
}
