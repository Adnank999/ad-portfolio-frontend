import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function MediaPublishingCaseStudiesPage() {
  const industry = getIndustry("media-publishing");
  return industry ? <IndustryPage industry={industry} /> : null;
}
