import { motion } from 'framer-motion'
export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: .45 }} className="max-w-3xl">
    <p className="mb-4 text-xs font-semibold uppercase tracking-[.24em] text-accent-300"><span className="accent-text">{eyebrow}</span></p>
    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">{title}</h2>
    {description && <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">{description}</p>}
  </motion.div>
}
