import { createFileRoute } from "@tanstack/react-router";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyPending, CaseStudyLoadError } from "@/components/case-studies/feedback/CaseStudyFeedback";
import { EducationCaseStudiesPage } from "@/components/case-studies/education/EducationCaseStudiesPage";
import { getIndustry } from "@/data/case-studies";
import { industryHead } from "@/lib/caseStudySeo";

export const Route = createFileRoute("/case-studies/industries/education")({
  loader: ({ context }) => context.queryClient.fetchQuery(caseStudiesOptions()),
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
  head: ({ loaderData }) => {
    const industry = getIndustry("education");
    return industry ? industryHead(industry, loaderData ?? []) : {};
  },
  component: EducationCaseStudiesPage,
});
