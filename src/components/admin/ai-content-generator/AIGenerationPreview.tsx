import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { contentEditorExtensions } from '@/components/admin/content/editorExtensions'
import { emptyField, fieldsFor, type AIField, type AIProposal } from '@/lib/ai-content/contracts'
import { readableValue } from '@/lib/ai-content/validation'
import type { ContentKind, JsonObject } from '@/server/portfolio-content'

function RichPreview({ document }: { document: JsonObject }) {
  const editor = useEditor({ extensions: contentEditorExtensions(), content: document, editable: false, immediatelyRender: false })
  useEffect(() => { if (editor) editor.commands.setContent(document, { emitUpdate: false }) }, [editor, document])
  return <div className="admin-editor max-h-96 overflow-auto rounded-lg border border-white/10 bg-[#0b0b0e]"><EditorContent editor={editor} aria-label="Generated rich content" /></div>
}

export function AIGenerationPreview({ kind, proposals, selected, onSelect, onRegenerate, pending }: {
  kind: ContentKind; proposals: AIProposal[]; selected: AIField[]; onSelect: (fields: AIField[]) => void
  onRegenerate: (fields: AIField[]) => void; pending: boolean
}) {
  const specs = fieldsFor(kind)
  const groups = [...new Set(specs.filter((spec) => proposals.some((entry) => entry.field === spec.key)).map((spec) => spec.group))]
  return <section aria-labelledby="ai-preview-title" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="ai-preview-title" className="text-3xl text-white">Generated content preview</h3><p className="mt-2 text-xs leading-5 text-zinc-400">Choose the proposed fields to apply. Nothing is saved yet.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => onSelect(proposals.map((proposal) => proposal.field))}>Select all</Button><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => onSelect([])}>Clear</Button><Button type="button" variant="secondary" size="sm" disabled={pending || !selected.length} onClick={() => onRegenerate(selected)}><RefreshCw size={13} /> Regenerate selected</Button></div></div>
    {groups.map((group) => <section key={group} className="space-y-3"><div className="flex items-center justify-between gap-3"><h4 className="text-[11px] font-semibold uppercase tracking-widest text-accent-200"><span className="accent-text">{group}</span></h4><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => onRegenerate(proposals.filter((proposal) => specs.find((spec) => spec.key === proposal.field)?.group === group).map((proposal) => proposal.field))}>Regenerate group</Button></div>
      {proposals.filter((proposal) => specs.find((spec) => spec.key === proposal.field)?.group === group).map((proposal) => {
        const spec = specs.find((entry) => entry.key === proposal.field)!
        return <div key={proposal.field} className="rounded-xl border border-white/10 bg-[#111116] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-9 cursor-pointer items-center gap-3 text-xs font-medium text-white"><input type="checkbox" checked={selected.includes(proposal.field)} disabled={pending} onChange={(event) => onSelect(event.target.checked ? [...selected, proposal.field] : selected.filter((field) => field !== proposal.field))} className="size-4 accent-accent-500" />{spec.label}</label><Button type="button" variant="ghost" size="sm" disabled={pending} aria-label={`Regenerate ${spec.label}`} onClick={() => onRegenerate([proposal.field])}><RefreshCw size={13} /> Regenerate</Button></div>
          {!emptyField(proposal.baseline) && <details className="mb-4 rounded-lg border border-white/8 p-3"><summary className="cursor-pointer text-[11px] text-amber-200">Compare existing value</summary><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-400">{readableValue(proposal.baseline)}</pre></details>}
          <p className="mb-3 text-[10px] uppercase tracking-widest text-accent-300"><span className="accent-text">Proposed value</span></p>
          {spec.type === 'document' ? <RichPreview document={proposal.value as JsonObject} /> : <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-7 text-zinc-200">{readableValue(proposal.value)}</pre>}
        </div>
      })}
    </section>)}
  </section>
}
