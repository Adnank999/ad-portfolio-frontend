import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { assertSameOrigin, portfolioApi } from './portfolio-api'
import type { AIRequest, AIResponse } from '@/lib/ai-content/contracts'
import { validateAIRequest } from '@/lib/ai-content/validation'

export const generateAIContentFn = createServerFn({ method: 'POST' })
  .validator((input: AIRequest) => validateAIRequest(input))
  .handler(async ({ data }) => {
    assertSameOrigin()
    return portfolioApi<AIResponse>('/api/v1/admin/ai/generate', {
      method: 'POST', body: data, authenticated: true, timeoutMs: 130_000, signal: getRequest().signal,
    })
  })
