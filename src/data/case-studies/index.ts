import { projects } from "@/data/projects";
import { conceptStudies } from "./concepts";
import { industries, getIndustry } from "./industries";
import type { Answer, CaseStudy, Industry, IndustrySlug } from "./types";

const projectIndustries: Record<string, IndustrySlug> = {
  "hotel-booking-platform": "hospitality-real-estate",
  "travel-explorer": "hospitality-real-estate",
  "commerce-studio": "retail-ecommerce",
  "saas-command-center": "technology-saas",
  "ai-vision-lab": "technology-saas",
  "developer-observatory": "technology-saas",
};

const portfolioStudies: CaseStudy[] = projects.map((project) => ({
  slug: project.slug,
  industry: projectIndustries[project.slug],
  projectSlug: project.slug,
  title: project.title,
  description: project.description,
  status: "portfolio",
  context: project.overview,
  problem: project.problem,
  solution: project.solution,
  steps: [
    { title: "Map the problem", text: project.problem },
    { title: "Shape the experience", text: project.solution },
    { title: "Connect the architecture", text: project.technical },
    { title: "Review the trade-offs", text: project.challenges },
  ],
  technologies: project.technologies,
  outcomes: [
    { title: "Designed outcome", text: project.results },
    { title: "Capabilities explored", text: project.features.join(". ") + "." },
    { title: "Evidence boundary", text: "This study expands an existing portfolio entry. No independent business metrics, client endorsement, or production deployment is asserted." },
  ],
  lessons: [project.challenges, "Keep the primary user journey clear as the product grows.", "Treat operating states, exceptions, and future changes as part of the design."],
  faqs: [
    { question: "What is the source of this case study?", answer: `This study expands the existing ${project.title} entry in Adnan's portfolio. It describes its stated design and technical approach.` },
    { question: "Are measured business results available?", answer: "No verified business metrics are supplied for this portfolio entry. The outcomes describe design capabilities and intended benefits, not measured gains." },
    { question: "Which technologies does the portfolio entry list?", answer: project.technologies.join(", ") + "." },
    { question: "Can I discuss a similar project?", answer: "Yes. Use the contact page to describe your workflow, constraints, and goals. A new project would need its own discovery and agreed scope." },
  ],
}));

export const caseStudies: CaseStudy[] = [...portfolioStudies, ...conceptStudies];
export { industries, getIndustry };
export type { Answer, CaseStudy, Industry };

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}

export function getIndustryStudies(slug: string) {
  return caseStudies.filter((study) => study.industry === slug);
}

export function getIndustryFaqs(industry: Industry, collection: import('./types').CaseStudySummary[] = caseStudies): Answer[] {
  const studies = collection.filter(study => study.industry === industry.slug);
  const concepts = studies.filter((study) => study.status === "concept").length;
  return [
    { question: `What do the ${industry.name} case studies cover?`, answer: industry.description },
    { question: "Are these client projects or concepts?", answer: `This collection contains ${studies.length} ${studies.length === 1 ? "study" : "studies"}, including ${concepts} ${concepts === 1 ? "new concept" : "new concepts"}. Every card and detail page identifies its source. Existing portfolio entries are not presented as independently verified client engagements.` },
    { question: "Are the outcomes independently measured?", answer: "No independent business measurements are supplied. Each study distinguishes proposed capabilities and design outcomes from verified production results." },
    { question: "Can I discuss a project in this industry?", answer: "Yes. Use the contact page to describe the workflow you want to improve. We can discuss requirements and feasibility without assuming that an illustrative concept is production-ready." },
  ];
}

export const caseStudyFaqs: Answer[] = [
  { question: "What is included in this collection?", answer: "The collection includes expanded entries from the existing software portfolio and new, explicitly labeled concept studies for additional industries." },
  { question: "Do concept studies represent real clients?", answer: "No. Concepts use fictional scenarios to explain product and engineering choices. They do not imply commissioned work, endorsements, production deployments, or measured business results." },
  { question: "How can I browse a particular industry?", answer: "Choose an industry from the collection filters or the Case studies navbar menu. Counts reflect the entries currently available in that category." },
];
