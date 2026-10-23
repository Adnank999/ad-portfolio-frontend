import { caseStudies } from '../src/data/case-studies'
import { projects } from '../src/data/projects'

const records = caseStudies.map(study => {
  const project = projects.find(project => project.slug === study.projectSlug)
  return {
    slug: study.slug, title: study.title, description: study.description, status: 'published',
    fields: {
      industry: study.industry, studyType: study.status,
      image: project?.image ?? '/images/case-studies-cover.png',
      imageAlt: project ? `${project.title} project preview` : 'Software case study cover',
      gallery: [], context: study.context, problem: study.problem, solution: study.solution,
      steps: study.steps, technologies: study.technologies, outcomes: study.outcomes,
      lessons: study.lessons, projectSlug: study.projectSlug ?? '',
    },
    seo: { metaTitle: `${study.title} | Adnan Hossain Khan`, metaDescription: study.description },
    faqs: study.faqs,
  }
})
console.log(JSON.stringify(records, null, 2))
