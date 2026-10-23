import { createFileRoute } from "@tanstack/react-router";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyPending, CaseStudyLoadError } from "@/components/case-studies/feedback/CaseStudyFeedback";
import { HealthcareCaseStudiesPage } from "@/components/case-studies/healthcare/HealthcareCaseStudiesPage";
import { getIndustry } from "@/data/case-studies";
import { industryHead } from "@/lib/caseStudySeo";

export const Route = createFileRoute("/case-studies/industries/healthcare")({
  loader: ({ context }) => context.queryClient.fetchQuery(caseStudiesOptions()),
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
  head: ({ loaderData }) => {
    const industry = getIndustry("healthcare");
    return industry ? industryHead(industry, loaderData ?? []) : {};
  },
  component: HealthcareCaseStudiesPage,
});
