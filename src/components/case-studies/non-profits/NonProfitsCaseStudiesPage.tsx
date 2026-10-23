import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function NonProfitsCaseStudiesPage() {
  const industry = getIndustry("non-profits");
  return industry ? <IndustryPage industry={industry} /> : null;
}
