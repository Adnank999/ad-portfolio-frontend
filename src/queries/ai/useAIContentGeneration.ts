import { useMutation } from '@tanstack/react-query'
import { generateAIContentFn } from '@/server/ai-content'
import type { AIRequest } from '@/lib/ai-content/contracts'
import { validateAIResponse } from '@/lib/ai-content/validation'

export function useAIContentGeneration() {
  return useMutation({
    mutationKey: ['ai', 'generate-content'], retry: false, gcTime: 0,
    mutationFn: async ({ request, signal }: { request: AIRequest; signal: AbortSignal }) => {
      const response = await generateAIContentFn({ data: request, signal })
      return validateAIResponse(response, request)
    },
  })
}
