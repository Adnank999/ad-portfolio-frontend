import { createServerFn } from '@tanstack/react-start'
import { contactSubmissionSchema, type ContactResult } from '@/components/global/contact-page/contact-channels'
import { assertSameOrigin, portfolioApi, PortfolioApiError } from './portfolio-api'

export const sendContactFn = createServerFn({ method: 'POST' })
  .validator((input: unknown) => contactSubmissionSchema.parse(input))
  .handler(async ({ data }): Promise<ContactResult> => {
    assertSameOrigin()
    try {
      await portfolioApi('/api/v1/contact', { method: 'POST', body: data })
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error instanceof PortfolioApiError && error.status === 429
        ? 'Too many enquiries. Please wait a minute, then try again.'
        : 'Your enquiry could not be confirmed. Your message is still here; please try again shortly.' }
    }
  })
