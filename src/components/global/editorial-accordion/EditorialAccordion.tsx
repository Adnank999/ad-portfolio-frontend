import { useId, useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import './editorial-accordion.css'

export type EditorialItem = { title: string; content: ReactNode }

export function EditorialAccordion({ items, light = false, initialOpen = null }: { items: EditorialItem[]; light?: boolean; initialOpen?: number | null }) {
  const [expanded, setExpanded] = useState<number | null>(initialOpen)
  const identifier = useId()
  return <div className="editorial-accordion" data-theme={light ? 'light' : 'dark'}>
    {items.map((item, index) => {
      const open = expanded === index
      const trigger = `${identifier}-question-${index}`
      const panel = `${trigger}-answer`
      return <article key={item.title} className="editorial-accordion-item" data-expanded={open}>
        <h3><button id={trigger} type="button" aria-expanded={open} aria-controls={panel} onClick={() => setExpanded(open ? null : index)}>
          <small aria-hidden="true">{String(index + 1).padStart(2, '0')}</small>
          <span>{item.title}</span>{open ? <Minus size={23} aria-hidden="true" /> : <Plus size={23} aria-hidden="true" />}
        </button></h3>
        <div id={panel} role="region" aria-labelledby={trigger} hidden={!open} className="editorial-accordion-answer">{item.content}</div>
      </article>
    })}
  </div>
}
