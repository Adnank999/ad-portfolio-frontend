import { createFileRoute } from "@tanstack/react-router";
import { CaseStudiesIndexPage } from "@/components/case-studies/case-studies-index/CaseStudiesIndexPage";
import { caseStudyIndexHead } from "@/lib/caseStudySeo";
import { caseStudiesOptions } from "@/queries/case-studies/case-studies";
import { CaseStudyLoadError, CaseStudyPending } from "@/components/case-studies/feedback/CaseStudyFeedback";

export const Route = createFileRoute("/case-studies/")({
  loader: ({ context }) => context.queryClient.fetchQuery(caseStudiesOptions()),
  preloadStaleTime: 0,
  head: ({ loaderData }) => caseStudyIndexHead(loaderData ?? []),
  component: () => <CaseStudiesIndexPage studies={Route.useLoaderData()} />,
  pendingComponent: CaseStudyPending,
  errorComponent: CaseStudyLoadError,
});
