import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function LogisticsCaseStudiesPage() {
  const industry = getIndustry("logistics");
  return industry ? <IndustryPage industry={industry} /> : null;
}
