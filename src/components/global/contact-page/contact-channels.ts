import { z } from 'zod'

export const enquirySchema = z.strictObject({
  name: z.string().trim().min(2, 'Please enter your name.').max(100).refine(value => !/[\x00-\x1f\x7f]/.test(value), 'Please enter a single-line name.'),
  email: z.email('Please enter a valid email address.').max(254),
  subject: z.string().trim().min(2, 'Please add a subject.').max(160).refine(value => !/[\x00-\x1f\x7f]/.test(value), 'Please enter a single-line subject.'),
  message: z.string().trim().min(10, 'Please add a little more detail (at least 10 characters).').max(4000),
})
export type Enquiry = z.infer<typeof enquirySchema>
export const contactSubmissionSchema = enquirySchema.extend({ requestId: z.uuid(), website: z.string().max(200).default('') })
export type ContactSubmission = z.infer<typeof contactSubmissionSchema>
export type ContactResult = { ok: true } | { ok: false; message: string }

export function validContactEmail(value: string | undefined) {
  const result = z.email().safeParse(value?.trim())
  return result.success ? result.data : null
}

export const contactEmail = validContactEmail(import.meta.env.VITE_CONTACT_EMAIL)
const phone = import.meta.env.VITE_CONTACT_WHATSAPP?.trim()
export const contactWhatsApp = phone && /^[1-9]\d{7,14}$/.test(phone) ? `https://wa.me/${phone}` : null
