import type { ServiceArtworkKind } from "@/components/global/service-page/servicePage.types";

export type Answer = { question: string; answer: string };
export type IndustrySlug = "manufacturing" | "retail-ecommerce" | "healthcare" | "education" | "hospitality-real-estate" | "media-publishing" | "music-entertainment" | "technology-saas" | "logistics" | "non-profits";
export type Industry = {
  slug: IndustrySlug;
  name: string;
  description: string;
  perspective: string;
  audiences: string[];
  priorities: string[];
  artwork: ServiceArtworkKind;
  related: IndustrySlug[];
};
export type CaseStudy = {
  slug: string;
  industry: IndustrySlug;
  title: string;
  description: string;
  status: "portfolio" | "concept";
  context: string;
  problem: string;
  solution: string;
  steps: { title: string; text: string }[];
  technologies: string[];
  outcomes: { title: string; text: string }[];
  lessons: string[];
  faqs: Answer[];
  projectSlug?: string;
  image?: string;
  imageAlt?: string;
  gallery?: { url: string; alt: string; caption: string }[];
  editorContent?: import('@/server/portfolio-content').JsonObject | null;
  renderedHtml?: string;
  seo?: import('@/data/blog/types').BlogSeo;
  structuredData?: import('@/server/portfolio-content').JsonObject;
};

export type CaseStudySummary = Pick<CaseStudy, 'slug' | 'industry' | 'title' | 'description' | 'status' | 'image' | 'imageAlt' | 'technologies'>;
