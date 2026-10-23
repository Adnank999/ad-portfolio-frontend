import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/components/sections/HomePage'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Adnan Hossain Khan — Full Stack Developer' },
    { name: 'description', content: 'Full stack developer portfolio focused on Laravel, React, TypeScript, APIs, performance and product engineering.' },
  ] }),
  component: HomePage,
})
