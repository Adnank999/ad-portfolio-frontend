import { createFileRoute } from "@tanstack/react-router";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyPending, CaseStudyLoadError } from "@/components/case-studies/feedback/CaseStudyFeedback";
import { TechnologySaasCaseStudiesPage } from "@/components/case-studies/technology-saas/TechnologySaasCaseStudiesPage";
import { getIndustry } from "@/data/case-studies";
import { industryHead } from "@/lib/caseStudySeo";

export const Route = createFileRoute("/case-studies/industries/technology-saas")({
  loader: ({ context }) => context.queryClient.fetchQuery(caseStudiesOptions()),
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
  head: ({ loaderData }) => {
    const industry = getIndustry("technology-saas");
    return industry ? industryHead(industry, loaderData ?? []) : {};
  },
  component: TechnologySaasCaseStudiesPage,
});
