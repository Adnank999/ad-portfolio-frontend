import { createFileRoute } from "@tanstack/react-router";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyPending, CaseStudyLoadError } from "@/components/case-studies/feedback/CaseStudyFeedback";
import { NonProfitsCaseStudiesPage } from "@/components/case-studies/non-profits/NonProfitsCaseStudiesPage";
import { getIndustry } from "@/data/case-studies";
import { industryHead } from "@/lib/caseStudySeo";

export const Route = createFileRoute("/case-studies/industries/non-profits")({
  loader: ({ context }) => context.queryClient.fetchQuery(caseStudiesOptions()),
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
  head: ({ loaderData }) => {
    const industry = getIndustry("non-profits");
    return industry ? industryHead(industry, loaderData ?? []) : {};
  },
  component: NonProfitsCaseStudiesPage,
});
