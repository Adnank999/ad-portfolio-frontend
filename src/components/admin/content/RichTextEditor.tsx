import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { contentEditorExtensions } from './editorExtensions'
import { Bold, Italic, Underline, List, ListOrdered, Quote, ImagePlus, Link2, Table2, Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { useImageUpload } from '@/queries/assets/upload'
import type { JsonObject } from '@/server/portfolio-content'

export type RichTextEditorHandle = { getDocument: () => JsonObject | null }

export function RichTextEditor({ initialDocument, initialHtml, value, onChange, ref }: {
  initialDocument: JsonObject | null
  initialHtml?: string
  value?: JsonObject | null
  ref?: Ref<RichTextEditorHandle>
  onChange: (document: JsonObject) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageAlt, setImageAlt] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const imageUpload = useImageUpload()
  const editor = useEditor({
    extensions: contentEditorExtensions(),
    content: initialDocument ?? initialHtml ?? '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON() as JsonObject),
  })
  useImperativeHandle(ref, () => ({ getDocument: () => editor?.getJSON() as JsonObject ?? null }), [editor])
  useEffect(() => {
    if (editor && value && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])
  const state = useEditorState({ editor, selector: ({ editor: instance }) => ({
    bold: instance?.isActive('bold') ?? false, italic: instance?.isActive('italic') ?? false, underline: instance?.isActive('underline') ?? false,
    bullet: instance?.isActive('bulletList') ?? false, ordered: instance?.isActive('orderedList') ?? false,
  }) })
  async function addImage(file: File | undefined) {
    if (!file || !editor || !imageAlt.trim()) return
    try {
      const source = await imageUpload.mutateAsync(file)
      editor.chain().focus().setImage({ src: source, alt: imageAlt.trim() }).run()
      setImageAlt('')
      if (fileRef.current) fileRef.current.value = ''
    } catch {}
  }
  function addLink() {
    if (!editor) return
    try {
      const parsed = new URL(linkUrl)
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Invalid link')
      editor.chain().focus().setLink({ href: parsed.toString() }).run()
      setLinkUrl('')
      setLinkError('')
    } catch { setLinkError('Enter a valid HTTP or HTTPS URL.') }
  }
  const toolbar = [
    { label: 'Bold', icon: Bold, active: state?.bold, run: () => editor?.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: state?.italic, run: () => editor?.chain().focus().toggleItalic().run() },
    { label: 'Underline', icon: Underline, active: state?.underline, run: () => editor?.chain().focus().toggleUnderline().run() },
    { label: 'Bulleted list', icon: List, active: state?.bullet, run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', icon: ListOrdered, active: state?.ordered, run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', icon: Quote, run: () => editor?.chain().focus().toggleBlockquote().run() },
    { label: 'Table', icon: Table2, run: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: 'Undo', icon: Undo2, run: () => editor?.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2, run: () => editor?.chain().focus().redo().run() },
  ]
  return <div className="admin-editor overflow-hidden rounded-xl border border-white/12 bg-[#0e0e12]">
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-2">
      {toolbar.map(({ label, icon: Icon, active, run }) => <Button key={label} type="button" size="icon" variant="ghost" aria-label={label} aria-pressed={!!active} className={active ? 'bg-accent-500/20 text-accent-200' : ''} onClick={run}><Icon size={15} /></Button>)}
      <select aria-label="Heading level" defaultValue="paragraph" onChange={(event) => { const level = Number(event.target.value); if (level) editor?.chain().focus().setHeading({ level: level as 2 | 3 | 4 }).run(); else editor?.chain().focus().setParagraph().run() }} className="h-10 rounded-lg bg-transparent px-2 text-xs text-zinc-300 outline-none focus-visible:ring-2 focus-visible:ring-accent-400"><option value="paragraph">Paragraph</option><option value="2">Heading 2</option><option value="3">Heading 3</option><option value="4">Heading 4</option></select>
    </div>
    <div className="flex flex-wrap gap-2 border-b border-white/10 p-3"><Input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" aria-label="Link URL" className="max-w-xs" /><Button type="button" variant="secondary" disabled={!linkUrl.trim()} onClick={addLink}><Link2 size={14} /> Add link</Button><Button type="button" variant="ghost" onClick={() => editor?.chain().focus().unsetLink().run()}>Remove link</Button>{linkError && <p role="alert" className="w-full text-xs text-red-300">{linkError}</p>}</div>
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3"><Input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Image description for accessibility" aria-label="Image alt text" className="max-w-sm" /><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => void addImage(event.target.files?.[0])} /><Button type="button" variant="secondary" disabled={!imageAlt.trim() || imageUpload.isPending} onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> {imageUpload.isPending ? 'Uploading…' : 'Insert image'}</Button></div>
    {imageUpload.error && <p role="alert" className="px-4 pt-3 text-xs text-red-300">{imageUpload.error.message}</p>}
    <EditorContent editor={editor} aria-label="Article body" />
  </div>
}
