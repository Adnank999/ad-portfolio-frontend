import { z } from 'zod'

export const enquiryTypes = ['A new website', 'A product or platform', 'Automation & integrations', 'Improve an existing product', 'Something else'] as const
export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(254),
  interest: z.enum(enquiryTypes),
  message: z.string().trim().min(20, 'Tell me a little more about your project (at least 20 characters).').max(4000),
  timeline: z.enum(['Exploring options', 'Within a month', 'Within three months', 'Flexible']),
})
export type Enquiry = z.infer<typeof enquirySchema>

export function validContactEmail(value: string | undefined) {
  const result = z.email().safeParse(value?.trim())
  return result.success ? result.data : null
}

export const contactEmail = validContactEmail(import.meta.env.VITE_CONTACT_EMAIL)
const phone = import.meta.env.VITE_CONTACT_WHATSAPP?.trim()
export const contactWhatsApp = phone && /^[1-9]\d{7,14}$/.test(phone) ? `https://wa.me/${phone}` : null

export function formatEnquiry(input: Enquiry) {
  const enquiry = enquirySchema.parse(input)
  return ['Hi Adnan,', '', `I'm ${enquiry.name}.`, `Email: ${enquiry.email}`, `Project: ${enquiry.interest}`, `Timing: ${enquiry.timeline}`, '', enquiry.message].join('\n')
}

export function enquiryMailto(email: string, enquiry: Enquiry) {
  const recipient = validContactEmail(email)
  if (!recipient) throw new Error('A receiving contact email has not been configured.')
  return `mailto:${recipient}?subject=${encodeURIComponent(`Project enquiry — ${enquiry.interest}`)}&body=${encodeURIComponent(formatEnquiry(enquiry))}`
}
