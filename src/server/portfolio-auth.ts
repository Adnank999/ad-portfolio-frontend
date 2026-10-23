import { createServerFn } from '@tanstack/react-start'
import { assertSameOrigin, clearAccessToken, portfolioApi, PortfolioApiError, setAccessToken } from './portfolio-api'

export type Account = {
  id: string
  email: string
  name: string
  headline: string
  roles: string[]
  permissions: string[]
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    const result = await portfolioApi<{ accessToken: string; expiresIn: number; user: Account }>('/api/v1/auth/login', { method: 'POST', body: data })
    setAccessToken(result.accessToken, result.expiresIn)
    return result.user
  })

export const registerFn = createServerFn({ method: 'POST' })
  .validator((input: { name: string; email: string; password: string }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    await portfolioApi('/api/v1/auth/register', { method: 'POST', body: data })
    return { ok: true }
  })

export const forgotPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    await portfolioApi('/api/v1/auth/forgot-password', { method: 'POST', body: data })
    return { ok: true }
  })

export const resetPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: { token: string; password: string }) => input)
  .handler(async ({ data }) => {
    assertSameOrigin()
    await portfolioApi('/api/v1/auth/reset-password', { method: 'POST', body: data })
    return { ok: true }
  })

export const meFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await portfolioApi<Account>('/api/v1/auth/me', { authenticated: true })
  } catch (error) {
    if (error instanceof PortfolioApiError && error.status === 401) return null
    throw error
  }
})

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  assertSameOrigin()
  try {
    await portfolioApi('/api/v1/auth/logout', { method: 'POST', authenticated: true })
  } finally {
    clearAccessToken()
  }
  return { ok: true }
})
