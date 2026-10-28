const publicPage = /^\/(?:$|(?:about|contact|services|projects|blogs?|case-studies)(?:\/[^.?]*)?$)/

function acceptsGzip(value: string | null) {
  const encodings = new Map((value ?? '').toLowerCase().split(',').map(part => {
    const [name, ...parameters] = part.trim().split(';')
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='))
    const weight = quality ? Number(quality.trim().slice(2)) : 1
    return [name.trim(), Number.isFinite(weight) && weight >= 0 && weight <= 1 ? weight : 0] as const
  }))
  return (encodings.get('gzip') ?? encodings.get('*') ?? 0) > 0
}

/** Compress public SSR HTML as it streams; authenticated responses remain untouched. */
export function compressPublicHtml(request: Request, response: Response): Response {
  if (request.method !== 'GET' || !publicPage.test(new URL(request.url).pathname)
    || request.headers.has('cookie') || request.headers.has('authorization') || request.headers.has('range')
    || response.status !== 200 || !response.body || response.headers.has('set-cookie')
    || response.headers.has('content-encoding') || /\bno-transform\b/i.test(response.headers.get('cache-control') ?? '')
    || !/^text\/html(?:;|$)/i.test(response.headers.get('content-type') ?? '')) return response

  const headers = new Headers(response.headers)
  const vary = headers.get('vary')?.split(',').map(value => value.trim()) ?? []
  if (!vary.some(value => /^(?:accept-encoding|\*)$/i.test(value))) headers.append('vary', 'Accept-Encoding')
  if (!acceptsGzip(request.headers.get('accept-encoding'))) return new Response(response.body, { status: response.status, statusText: response.statusText, headers })

  headers.set('content-encoding', 'gzip')
  headers.delete('content-length')
  headers.delete('etag')
  return new Response(response.body.pipeThrough(new CompressionStream('gzip')), { status: response.status, statusText: response.statusText, headers })
}
