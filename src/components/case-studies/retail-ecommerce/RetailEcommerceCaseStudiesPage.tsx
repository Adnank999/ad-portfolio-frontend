import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function RetailEcommerceCaseStudiesPage() {
  const industry = getIndustry("retail-ecommerce");
  return industry ? <IndustryPage industry={industry} /> : null;
}
