import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/components/sections/HomePage'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Adnan Hossain Khan — Ideas into reality' },
    { name: 'description', content: 'Thoughtful systems. Remarkable experiences. Explore the products, projects and engineering work of Adnan Hossain Khan.' },
  ] }),
  component: HomePage,
})
