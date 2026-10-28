import { afterEach, expect, test } from 'bun:test'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { EditorialAccordion } from '../src/components/global/editorial-accordion/EditorialAccordion'
import { ContactPage } from '../src/components/global/contact-page/ContactPage'
import { SiteFooter } from '../src/components/global/site-footer/SiteFooter'
import { contactSubmissionSchema, enquirySchema, validContactEmail, type ContactResult, type ContactSubmission } from '../src/components/global/contact-page/contact-channels'
import { withoutAppendedFaq } from '../src/lib/articleFaq'
import { TestRouter } from './helpers/TestRouter'
import { publicServiceCopy } from '../src/lib/services/public-service-copy'
import type { PublishedService } from '../src/lib/services/services'

afterEach(cleanup)
const enquiry = { name: 'Alex Morgan', email: 'alex@test.invalid', subject: 'A new website', message: 'A booking website with a clear enquiry flow.' }

test('legacy CMS positioning is neutral in public copy and structured data without overwriting saved content', () => {
  const before = 'I am an independent developer based in Bangladesh. Whether that location is nearshore to you depends on where your team works. This service is a direct collaboration with me; staffing a larger team is outside the standard scope.'
  const stored = { slug: 'nearshore-software-development', faqs: [{ question: 'Who will I work with?', answer: before }], structuredData: { text: before }, media: [{ url: '/keep.webp' }] } as unknown as PublishedService
  const published = publicServiceCopy(stored)
  expect(JSON.stringify(published)).not.toContain('Bangladesh')
  expect(published.faqs[0].answer).toContain('independent developer, not an agency')
  expect(published.structuredData.text).toBe(published.faqs[0].answer)
  expect(published.media).toEqual(stored.media)
  expect(stored.faqs[0].answer).toBe(before)
  const other = { ...stored, slug: 'another-service' }
  expect(publicServiceCopy(other)).toBe(other)
})

test('shared numbered FAQs preserve copy, expose associated regions and allow one open answer', () => {
  render(<EditorialAccordion items={[{ title: 'How does this work?', content: <p>Original answer.</p> }, { title: 'What comes next?', content: <p>The unchanged next answer.</p> }]} />)
  const first = screen.getByRole('button', { name: 'How does this work?' })
  expect(first.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(first)
  expect(screen.getByRole('region', { name: 'How does this work?' }).textContent).toBe('Original answer.')
  fireEvent.click(screen.getByRole('button', { name: 'What comes next?' }))
  expect(first.getAttribute('aria-expanded')).toBe('false')
  expect(screen.getAllByRole('region')).toHaveLength(1)
  expect(screen.getByRole('button', { name: 'What comes next?' }).getAttribute('aria-controls')).toBe(screen.getByRole('region', { name: 'What comes next?' }).id)
  expect(screen.getByRole('heading', { name: 'How does this work?' }).tagName).toBe('H3')
})

test('FAQ SSR keeps original answers and strips only the appended generated blog section', () => {
  const body = '<h2>A real article</h2><p>Keep this text.</p>'
  const generated = '<section><h2>Frequently asked questions</h2><details><summary>Question?</summary><p>Answer.</p></details></section>'
  expect(withoutAppendedFaq(body + generated)).toBe(body)
  expect(withoutAppendedFaq(body)).toBe(body)
  const markup = renderToString(<EditorialAccordion items={[{ title: 'Original question?', content: <p>Original answer.</p> }]} light />)
  expect(markup).toContain('Original answer.')
  expect(markup).toContain('data-theme="light"')
  expect(markup).toContain('hidden=""')
})

test('enquiries validate length, addresses, header injection and server-owned fields', () => {
  expect(enquirySchema.safeParse(enquiry).success).toBe(true)
  expect(enquirySchema.safeParse({ ...enquiry, message: 'short' }).success).toBe(false)
  expect(enquirySchema.safeParse({ ...enquiry, email: 'not-an-email' }).success).toBe(false)
  expect(validContactEmail('javascript:bad')).toBeNull()
  expect(enquirySchema.safeParse({ ...enquiry, subject: 'Hi\nBcc: attacker@test.invalid' }).success).toBe(false)
  expect(enquirySchema.safeParse({ ...enquiry, message: 'x'.repeat(4001) }).success).toBe(false)
  expect(contactSubmissionSchema.safeParse({ ...enquiry, requestId: crypto.randomUUID(), to: 'attacker@test.invalid' }).success).toBe(false)
  expect(contactSubmissionSchema.safeParse({ ...enquiry, requestId: 'bad' }).success).toBe(false)
})

test('contact form sends directly, prevents duplicate clicks and retries uncertain delivery with the same key', async () => {
  const original = globalThis.FormData
  globalThis.FormData = window.FormData as typeof FormData
  try {
    const calls: ContactSubmission[] = []
    let finish!: (value: ContactResult) => void
    const send = (input: ContactSubmission) => { calls.push(input); return new Promise<ContactResult>(resolve => { finish = resolve }) }
    const view = render(<TestRouter><ContactPage email={null} whatsapp={null} sendEnquiry={send} /></TestRouter>)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: enquiry.name } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: enquiry.email } })
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: enquiry.subject } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: enquiry.message } })
    fireEvent.submit(view.container.querySelector('form')!)
    fireEvent.submit(view.container.querySelector('form')!)
    expect(calls).toHaveLength(1)
    expect((screen.getByRole('button', { name: 'Sending…' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('status').textContent).not.toContain('sent')
    await act(async () => finish({ ok: false, message: 'Email unavailable. Please retry.' }))
    expect(screen.getByRole('alert').textContent).toContain('retry')
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe(enquiry.message)
    fireEvent.submit(view.container.querySelector('form')!)
    expect(calls[1].requestId).toBe(calls[0].requestId)
    expect(calls[1]).toMatchObject({ ...enquiry, website: '' })
    await act(async () => finish({ ok: true }))
    expect(screen.getByRole('status').textContent).toContain('enquiry has been sent')
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('')
    expect(screen.queryByRole('link', { name: 'Open email draft' })).toBeNull()
    expect(screen.queryByText('Prepare my enquiry')).toBeNull()
  } finally { globalThis.FormData = original }
})

test('contact failures preserve text and edited enquiries receive a new retry key', async () => {
  const original = globalThis.FormData
  globalThis.FormData = window.FormData as typeof FormData
  try {
    const calls: ContactSubmission[] = []
    const view = render(<TestRouter><ContactPage sendEnquiry={async input => { calls.push(input); throw new Error('Network unavailable') }} /></TestRouter>)
    const form = view.container.querySelector('form')!
    fireEvent.submit(form)
    expect(calls).toHaveLength(0)
    for (const [label, value] of [['Your name', enquiry.name], ['Email address', enquiry.email], ['Subject', enquiry.subject], ['Message', enquiry.message]]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fireEvent.submit(form)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('could not be confirmed'))
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe(enquiry.message)
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Updated project' } })
    fireEvent.submit(form)
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1].requestId).not.toBe(calls[0].requestId)
  } finally { globalThis.FormData = original }
})

test('footer has real public navigation without repeated job titles, placeholder links or framework credits', () => {
  render(<TestRouter><SiteFooter /></TestRouter>)
  expect(screen.getByRole('navigation', { name: 'Footer navigation' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Let’s talk about it' }).getAttribute('href')).toBe('/contact')
  const markup = screen.getByRole('contentinfo').innerHTML
  expect(markup).not.toContain('TanStack')
  expect(markup).not.toContain('Full Stack')
  expect(markup).not.toContain('href="#"')
  expect(markup).not.toContain('example.com')
})

test('navigation is centered, service art is replaced with icons and mobile titles can wrap', () => {
  const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
  const styles = read('styles/navbar.css')
  const navigation = styles.match(/\.portfolio-nav\s*\{([^}]+)\}/)![1]
  expect(navigation.match(/left:\s*([^;]+);/)![1]).toBe(navigation.match(/right:\s*([^;]+);/)![1])
  expect(styles).not.toContain('right: 186px;')
  expect(read('components/layout/sign-in-button/sign-in-button.css')).not.toContain('.portfolio-nav { right:')
  expect(read('components/layout/NavbarMenus.tsx')).toContain('<ServiceMenuIcon href={item.href} />')
  expect(read('components/layout/NavbarMenus.tsx')).not.toContain('portfolio-nav-service-art portfolio-nav-art-')
  expect(read('components/global/service-page/service-page.css')).toContain('overflow-wrap: anywhere')
  expect(read('components/global/service-page/ServicePage.tsx')).not.toContain('Bangladesh')
})
