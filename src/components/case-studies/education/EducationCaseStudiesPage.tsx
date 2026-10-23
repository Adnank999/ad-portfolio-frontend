import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function EducationCaseStudiesPage() {
  const industry = getIndustry("education");
  return industry ? <IndustryPage industry={industry} /> : null;
}
