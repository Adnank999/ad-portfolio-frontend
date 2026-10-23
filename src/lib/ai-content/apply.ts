import type { ContentWrite, JsonObject, JsonValue } from '@/server/portfolio-content'
import { emptyField, fieldValue, type AIField, type AIProposal } from './contracts'

const same = (left: JsonValue, right: JsonValue) => JSON.stringify(left) === JSON.stringify(right)

export function preserveImages(generated: JsonObject, existing: JsonValue): JsonObject {
  const content = structuredClone(Array.isArray(generated.content) ? generated.content : [])
  const images: { node: JsonObject; position: number }[] = []
  function visit(value: JsonValue, position: number) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return
    if (value.type === 'image') { images.push({ node: structuredClone(value), position }); return }
    if (Array.isArray(value.content)) value.content.forEach((child) => visit(child, position))
  }
  if (existing && typeof existing === 'object' && !Array.isArray(existing) && Array.isArray(existing.content)) existing.content.forEach(visit)
  for (const { node, position } of images) content.splice(Math.min(position, content.length), 0, node)
  return { ...generated, content }
}

export function applyProposals(document: ContentWrite, currentSnapshot: ContentWrite, proposals: AIProposal[], selected: AIField[], fillOnly: boolean) {
  const next = structuredClone(document)
  const applied: AIField[] = []
  const conflicts: AIField[] = []
  for (const proposal of proposals.filter((entry) => selected.includes(entry.field))) {
    const current = fieldValue(currentSnapshot, proposal.field)
    if (fillOnly && !emptyField(current)) continue
    if (!same(current, proposal.baseline)) { conflicts.push(proposal.field); continue }
    let value = structuredClone(proposal.value)
    if (proposal.field === 'editorContent') value = preserveImages(value as JsonObject, current)
    if (proposal.field === 'faqs') {
      const questions = new Set((next.faqs ?? []).map((faq) => faq.question.trim().toLowerCase()))
      const additions = (value as { question: string; answer: string }[]).filter((faq) => {
        const question = faq.question.trim().toLowerCase()
        if (questions.has(question)) return false
        questions.add(question)
        return true
      })
      if ((next.faqs?.length ?? 0) + additions.length > 30) { conflicts.push(proposal.field); continue }
      next.faqs = [...(next.faqs ?? []), ...additions]
    } else if (proposal.field.startsWith('fields.')) next.fields[proposal.field.slice(7)] = value
    else if (proposal.field.startsWith('seo.')) next.seo = { ...next.seo, [proposal.field.slice(4)]: value }
    else if (proposal.field === 'editorContent') next.editorContent = value as JsonObject
    else if (proposal.field === 'title' || proposal.field === 'slug' || proposal.field === 'description') next[proposal.field] = value as string
    applied.push(proposal.field)
  }
  return { document: next, applied, conflicts }
}
