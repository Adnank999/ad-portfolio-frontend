import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function ManufacturingCaseStudiesPage() {
  const industry = getIndustry("manufacturing");
  return industry ? <IndustryPage industry={industry} /> : null;
}
