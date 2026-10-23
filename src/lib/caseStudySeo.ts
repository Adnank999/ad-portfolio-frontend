import { caseStudyFaqs, getIndustryFaqs } from "@/data/case-studies";
import type { CaseStudySummary } from "@/data/case-studies/types";
import type { Answer, CaseStudy, Industry } from "@/data/case-studies";
import { siteUrl } from "./siteUrl";

type Crumb = { name: string; path: string };
const indexCrumbs: Crumb[] = [{ name: "Home", path: "/" }, { name: "Case studies", path: "/case-studies" }];
const previewPath = "/images/case-studies-cover.png";

function head({ title, description, path, crumbs, faqs, entity }: { title: string; description: string; path: string; crumbs: Crumb[]; faqs: Answer[]; entity: Record<string, unknown> }) {
  const url = siteUrl(path);
  const image = siteUrl(previewPath);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      { ...entity, "@id": url, url, name: title, description, image },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`, itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: siteUrl(crumb.path) })) },
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
    ],
  };

  return {
    meta: [
      { title: `${title} | Adnan Hossain Khan` },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: entity["@type"] === "Article" ? "article" : "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Adnan Hossain Khan — software case studies and concept explorations" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: "Adnan Hossain Khan — software case studies and concept explorations" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(graph).replace(/</g, "\\u003c") }],
  };
}

function collection(studies: CaseStudySummary[]) {
  return { "@type": "CollectionPage", mainEntity: { "@type": "ItemList", numberOfItems: studies.length, itemListElement: studies.map((study, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Article", headline: study.title, url: siteUrl(`/case-studies/${study.slug}`) } })) } };
}

export function caseStudyIndexHead(studies: CaseStudySummary[]) {
  return head({ title: "Software Case Studies by Industry", description: "Explore software portfolio work and clearly labeled concept studies across ten industries, with technical approaches, design outcomes, and FAQs.", path: "/case-studies", crumbs: indexCrumbs, faqs: caseStudyFaqs, entity: collection(studies) });
}

export function industryHead(industry: Industry, studies: CaseStudySummary[]) {
  return head({ title: `${industry.name} Case Studies`, description: industry.description, path: `/case-studies/industries/${industry.slug}`, crumbs: [...indexCrumbs, { name: industry.name, path: `/case-studies/industries/${industry.slug}` }], faqs: getIndustryFaqs(industry, studies), entity: collection(studies.filter(study => study.industry === industry.slug)) });
}

export function caseStudyHead(study: CaseStudy, industry: Industry) {
  if (study.seo && study.structuredData) {
    const seo = study.seo;
    return {
      meta: [
        { title: seo.metaTitle }, { name: 'description', content: seo.metaDescription }, { name: 'robots', content: seo.robots },
        { property: 'og:title', content: seo.ogTitle }, { property: 'og:description', content: seo.ogDescription },
        { property: 'og:type', content: seo.ogType }, { property: 'og:url', content: seo.canonicalUrl },
        { property: 'og:image', content: seo.ogImage }, { property: 'og:image:alt', content: seo.ogImageAlt },
        { name: 'twitter:card', content: seo.twitterCard }, { name: 'twitter:title', content: seo.twitterTitle },
        { name: 'twitter:description', content: seo.twitterDescription }, { name: 'twitter:image', content: seo.twitterImage },
      ],
      links: [{ rel: 'canonical', href: seo.canonicalUrl }],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(study.structuredData).replace(/</g, '\\u003c') }],
    };
  }
  return head({ title: study.title, description: study.description, path: `/case-studies/${study.slug}`, crumbs: [...indexCrumbs, { name: industry.name, path: `/case-studies/industries/${industry.slug}` }, { name: study.title, path: `/case-studies/${study.slug}` }], faqs: study.faqs, entity: { "@type": "Article", headline: study.title, articleSection: industry.name, creativeWorkStatus: study.status === "concept" ? "Concept study" : "Portfolio study", author: { "@type": "Person", name: "Adnan Hossain Khan" }, mainEntityOfPage: siteUrl(`/case-studies/${study.slug}`) } });
}
