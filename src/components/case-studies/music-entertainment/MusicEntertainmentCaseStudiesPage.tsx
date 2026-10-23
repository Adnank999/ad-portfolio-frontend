import { getIndustry } from "@/data/case-studies";
import { IndustryPage } from "@/components/global/industry-page/IndustryPage";

export function MusicEntertainmentCaseStudiesPage() {
  const industry = getIndustry("music-entertainment");
  return industry ? <IndustryPage industry={industry} /> : null;
}
