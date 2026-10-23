import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'

export function contentEditorExtensions() {
  return [StarterKit.configure({ heading: { levels: [2, 3, 4, 5, 6] }, link: { openOnClick: false } }), Image, TableKit]
}
