import { deleteCookie, getCookie, getRequest, setCookie } from '@tanstack/react-start/server'

const cookieName = 'portfolio_access'

export class PortfolioApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

function apiOrigin() {
  return process.env.PORTFOLIO_API_URL ?? 'http://127.0.0.1:8080'
}

function frontendOrigin() {
  return process.env.APP_ORIGIN ?? new URL(getRequest().url).origin
}

export function assertSameOrigin() {
  const origin = getRequest().headers.get('origin')
  if (!origin || origin !== frontendOrigin()) {
    throw new PortfolioApiError(403, 'Request origin was not accepted')
  }
}

export function accessToken() {
  return getCookie(cookieName) ?? null
}

export function setAccessToken(token: string, seconds: number) {
  setCookie(cookieName, token, {
    httpOnly: true,
    secure: frontendOrigin().startsWith('https://'),
    sameSite: 'strict',
    path: '/',
    maxAge: seconds,
  })
}

export function clearAccessToken() {
  deleteCookie(cookieName, {
    httpOnly: true,
    secure: frontendOrigin().startsWith('https://'),
    sameSite: 'strict',
    path: '/',
  })
}

export async function portfolioApi<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; authenticated?: boolean; timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const headers = new Headers()
  if (options.body !== undefined) headers.set('content-type', 'application/json')
  if (options.authenticated) {
    const token = accessToken()
    if (!token) throw new PortfolioApiError(401, 'Sign in to continue')
    headers.set('authorization', `Bearer ${token}`)
  }
  const response = await fetch(new URL(path, apiOrigin()), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
    signal: AbortSignal.any([AbortSignal.timeout(options.timeoutMs ?? 15_000), ...(options.signal ? [options.signal] : [])]),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new PortfolioApiError(response.status, result?.error?.message ?? `API request failed (${response.status})`)
  }
  return response.status === 204 ? null as T : response.json() as Promise<T>
}
