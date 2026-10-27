export function withoutAppendedFaq(html: string) {
  const marker = '<section><h2>Frequently asked questions</h2>'
  const start = html.lastIndexOf(marker)
  return start >= 0 && html.endsWith('</section>') ? html.slice(0, start) : html
}
