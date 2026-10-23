import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function HealthcareCaseStudiesPage() {
  const industry = getIndustry("healthcare");
  return industry ? <IndustryPage industry={industry} /> : null;
}
