import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function HospitalityRealEstateCaseStudiesPage() {
  const industry = getIndustry("hospitality-real-estate");
  return industry ? <IndustryPage industry={industry} /> : null;
}
