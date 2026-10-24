import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { caseStudies, getIndustry } from '../src/data/case-studies'
import { caseStudyHead, caseStudyIndexHead, industryHead } from '../src/lib/caseStudySeo'
import { fieldsFor, existingAIFields } from '../src/lib/ai-content/contracts'
import type { CaseStudy } from '../src/data/case-studies/types'
import type { ContentWrite } from '../src/server/portfolio-content'

const records: ContentWrite[] = JSON.parse(readFileSync(new URL('./fixtures/case-studies.json', import.meta.url), 'utf8'))

test('case-study contract fixture preserves every published study and FAQ without inventing evidence', () => {
  expect(records).toHaveLength(caseStudies.length)
  for (const study of caseStudies) {
    const record = records.find(record => record.slug === study.slug)!
    expect(record.title).toBe(study.title)
    expect(record.status).toBe('published')
    expect(record.fields.industry).toBe(study.industry)
    expect(record.fields.studyType).toBe(study.status)
    expect(record.fields.context).toBe(study.context)
    expect(record.fields.steps).toEqual(study.steps)
    expect(record.fields.outcomes).toEqual(study.outcomes)
    expect(record.faqs).toEqual(study.faqs)
    expect(String(record.fields.image)).not.toMatch(/\.svg(?:\?|$)/)
  }
})

test('case study AI exposes safe study fields and preserves source type, industry and media', () => {
  const fields = fieldsFor('case-studies').map(field => field.key)
  for (const field of ['fields.context', 'fields.lessons', 'fields.technologies', 'faqs', 'seo.metaTitle']) expect(fields).toContain(field)
  for (const field of ['fields.year', 'fields.category', 'fields.image', 'fields.gallery', 'status', 'seo.structuredData']) expect(fields).not.toContain(field)
  const snapshot = existingAIFields(records[0], 'case-studies')
  expect(snapshot['fields.image']).toBe(records[0].fields.image)
  expect(snapshot['fields.context']).toBe(records[0].fields.context)
  expect(snapshot['fields.liveUrl']).toBeUndefined()
})

test('collections and industry SEO reflect database records, not the frozen seed count', () => {
  const previous = process.env.VITE_SITE_URL
  process.env.VITE_SITE_URL = 'https://portfolio.test'
  try {
  const study = { ...caseStudies[0], slug: 'newly-published-case-study', title: 'New study' }
  const index = caseStudyIndexHead([study])
  const graph = JSON.parse(index.scripts[0].children)['@graph']
  expect(graph[0].mainEntity.numberOfItems).toBe(1)
  expect(graph[0].mainEntity.itemListElement[0].item.url).toContain('/case-studies/newly-published-case-study')
  const industry = getIndustry(study.industry)!
  const category = industryHead(industry, [study])
  expect(JSON.parse(category.scripts[0].children)['@graph'][0].mainEntity.numberOfItems).toBe(1)
  } finally {
    if (previous === undefined) delete process.env.VITE_SITE_URL
    else process.env.VITE_SITE_URL = previous
  }
})

test('stored SEO and JSON-LD are rendered safely in server-generated case study heads', () => {
  const study: CaseStudy = {
    ...caseStudies[0],
    seo: { metaTitle: 'Edited SEO', metaDescription: 'Edited description', canonicalUrl: 'https://portfolio.test/case-studies/current', ogTitle: 'Social title', ogDescription: 'Social description', ogImage: 'https://cdn.test/cover.webp', ogImageAlt: 'Uploaded cover', ogType: 'article', twitterCard: 'summary_large_image', twitterTitle: 'Twitter title', twitterDescription: 'Twitter description', twitterImage: 'https://cdn.test/cover.webp', robots: 'index,follow' },
    structuredData: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: '</script><script>alert(1)</script>' },
  }
  const head = caseStudyHead(study, getIndustry(study.industry)!)
  expect(head.meta[0]).toEqual({ title: 'Edited SEO' })
  expect(head.links[0].href).toBe(study.seo!.canonicalUrl)
  expect(head.scripts[0].children).not.toContain('<')
  expect(JSON.parse(head.scripts[0].children)).toEqual(study.structuredData)
})

test('case study loaders refetch invalidated archives after admin edits rather than returning stale ensureQueryData results', () => {
  for (const route of ['case-studies.index.tsx', 'case-studies.industries.healthcare.tsx', 'case-studies.industries.technology-saas.tsx']) {
    const source = readFileSync(new URL(`../src/routes/${route}`, import.meta.url), 'utf8')
    expect(source).toContain('fetchQuery(caseStudiesOptions())')
    expect(source).not.toContain('ensureQueryData(caseStudiesOptions())')
  }
  const mutations = readFileSync(new URL('../src/queries/content/content.ts', import.meta.url), 'utf8')
  expect(mutations.match(/queryKey: caseStudyKeys.all/g)).toHaveLength(3)
})
