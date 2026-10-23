import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function TechnologySaasCaseStudiesPage() {
  const industry = getIndustry("technology-saas");
  return industry ? <IndustryPage industry={industry} /> : null;
}
