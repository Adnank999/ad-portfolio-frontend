import { createFileRoute } from "@tanstack/react-router";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyPending, CaseStudyLoadError } from "@/components/case-studies/feedback/CaseStudyFeedback";
import { HospitalityRealEstateCaseStudiesPage } from "@/components/case-studies/hospitality-real-estate/HospitalityRealEstateCaseStudiesPage";
import { getIndustry } from "@/data/case-studies";
import { industryHead } from "@/lib/caseStudySeo";

export const Route = createFileRoute("/case-studies/industries/hospitality-real-estate")({
  loader: ({ context }) => context.queryClient.fetchQuery(caseStudiesOptions()),
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
  head: ({ loaderData }) => {
    const industry = getIndustry("hospitality-real-estate");
    return industry ? industryHead(industry, loaderData ?? []) : {};
  },
  component: HospitalityRealEstateCaseStudiesPage,
});
