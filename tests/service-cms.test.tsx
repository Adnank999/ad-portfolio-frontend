import { afterEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { renderToString } from 'react-dom/server'
import type { ContentWrite, JsonObject } from '../src/server/portfolio-content'
import { assertServicePageContent, groupServices, type ServiceSummary } from '../src/lib/services/services'
import { fieldsFor, existingAIFields, requestFields } from '../src/lib/ai-content/contracts'
import { applyProposals } from '../src/lib/ai-content/apply'
import { ServiceFields } from '../src/components/admin/service-fields/ServiceFields'
import { ServiceMedia } from '../src/components/global/service-media/ServiceMedia'
import schema from '../src/lib/services/page-content.schema.json'
import { serviceHead, servicesIndexHead } from '../src/lib/serviceSeo'
import { emptyServiceFields, type PublishedService } from '../src/lib/services/services'
import { emptyField } from '../src/lib/ai-content/contracts'

afterEach(cleanup)
const records: ContentWrite[] = JSON.parse(readFileSync(new URL('./fixtures/services.json', import.meta.url), 'utf8'))

test('all existing service defaults validate against the backend content schema snapshot', () => {
  expect(records).toHaveLength(13)
  expect(new Set(records.map(record => record.slug)).size).toBe(13)
  for (const record of records) {
    assertServicePageContent(record.fields.pageContent)
    expect(record.fields.enabled).toBe(true)
    expect(record.fields.navEnabled).toBe(true)
    expect(record.faqs?.length).toBeGreaterThan(0)
  }
  expect(schema).toEqual(JSON.parse(readFileSync(new URL('./fixtures/service-content.schema.json', import.meta.url), 'utf8')))
})

test('navbar switches are independent of public availability and sort by the saved order', () => {
  const services = records.slice(0, 3).map(record => ({ ...record.fields, slug: record.slug, title: record.title, description: record.description })) as unknown as ServiceSummary[]
  services[0].navEnabled = false
  services[1].enabled = false
  services[2].navTitle = 'Updated navbar title'
  services[2].navDescription = 'Updated navbar description'
  const menu = groupServices(services, true).flatMap(group => group.items)
  expect(menu).toHaveLength(1)
  expect(menu[0].label).toBe('Updated navbar title')
  expect(menu[0].description).toBe('Updated navbar description')
  expect(groupServices(services).flatMap(group => group.items)).toHaveLength(2)
})

test('admin fields show seeded copy and edit navbar and section data', () => {
  let current = records[0].fields
  function Form() {
    const [fields, setFields] = useState(current)
    current = fields
    return <ServiceFields fields={fields} onChange={(name, value) => setFields(fields => ({ ...fields, [name]: value }))} onBusyChange={() => {}} disabled={false} />
  }
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><Form /></QueryClientProvider>)
  expect((screen.getByLabelText('Navbar title') as HTMLInputElement).value).toBe(records[0].fields.navTitle)
  fireEvent.change(screen.getByLabelText('Navbar description'), { target: { value: 'Edited navigation copy' } })
  expect(current.navDescription).toBe('Edited navigation copy')
  fireEvent.click(screen.getByLabelText('Show in navbar'))
  expect(current.navEnabled).toBe(false)
  expect(current.enabled).toBe(true)
  const overview = (records[0].fields.pageContent as JsonObject).overview as JsonObject
  const input = screen.getByDisplayValue(String(overview.text))
  fireEvent.change(input, { target: { value: 'Edited overview' } })
  expect(((current.pageContent as JsonObject).overview as JsonObject).text).toBe('Edited overview')
})

test('AI can edit the page sections while preserving switches and uploaded media', () => {
  const original = structuredClone(records[0])
  original.fields.media = [{ slot: 'hero', kind: 'image', url: '/known.webp', alt: 'Known cover', poster: '', caption: '' }]
  const snapshot = existingAIFields(original, 'services')
  expect(snapshot['fields.image']).toBe('/known.webp')
  expect(snapshot['fields.enabled']).toBeUndefined()
  expect(fieldsFor('services').some(field => field.key === 'editorContent')).toBe(false)
  expect(requestFields('services', 'main', [], false, original)).toEqual(['fields.pageContent'])
  const next = structuredClone(original.fields.pageContent) as JsonObject
  next.faqTitle = 'New questions heading'
  const result = applyProposals(original, original, [{ field: 'fields.pageContent', value: next, baseline: original.fields.pageContent }], ['fields.pageContent'], false)
  expect(result.applied).toEqual(['fields.pageContent'])
  expect(result.document.fields.media).toEqual(original.fields.media)
  expect(result.document.fields.enabled).toBe(true)
  expect(result.document.fields.navEnabled).toBe(true)
})

test('uploaded media replaces illustrations and video playback remains user-controlled', () => {
  const image = renderToString(<ServiceMedia artwork="web" media={{ slot: 'overview', kind: 'image', url: '/uploaded.webp', alt: 'Portal dashboard', poster: '', caption: 'Overview' }} />)
  expect(image).toContain('/uploaded.webp')
  expect(image).toContain('Portal dashboard')
  expect(image).not.toContain('<svg')
  const video = renderToString(<ServiceMedia artwork="web" media={{ slot: 'hero', kind: 'video', url: '/demo.mp4', alt: 'Portal demonstration', poster: '/poster.webp', caption: '' }} />)
  expect(video).toContain('<video')
  expect(video).toContain('controls=')
  expect(video).toContain('/poster.webp')
  expect(video).not.toContain('autoPlay')
  expect(video).not.toContain('autoplay')
})

test('empty service sections can be filled with AI and saved SEO escapes script delimiters', () => {
  expect(emptyField(emptyServiceFields().pageContent)).toBe(true)
  const service = { ...records[0].fields, slug: records[0].slug, title: records[0].title, description: records[0].description, seo: { metaTitle: 'Stored SEO title', metaDescription: 'Stored description', canonicalUrl: 'https://portfolio.test/services/web-development', robots: 'index,follow' }, structuredData: { '@type': 'Service', name: '</script><script>alert(1)</script>' } } as unknown as PublishedService
  const head = serviceHead(service)
  expect(head.meta[0].title).toBe('Stored SEO title')
  expect(head.links[0].href).toBe(service.seo.canonicalUrl)
  expect(head.scripts[0].children).not.toContain('</script>')
  expect(JSON.parse(head.scripts[0].children).name).toContain('</script>')
  const previousOrigin = process.env.VITE_SITE_URL
  process.env.VITE_SITE_URL = 'https://portfolio.test'
  try {
    const index = servicesIndexHead([service, { ...service, enabled: false, slug: 'disabled' }])
    expect(JSON.parse(index.scripts[0].children).mainEntity.itemListElement).toHaveLength(1)
  } finally {
    if (previousOrigin === undefined) delete process.env.VITE_SITE_URL
    else process.env.VITE_SITE_URL = previousOrigin
  }
})
