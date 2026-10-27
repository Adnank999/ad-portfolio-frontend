import { createFileRoute } from '@tanstack/react-router'
import { About } from '@/components/sections/About'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About — Adnan Hossain Khan' },
      { name: 'description', content: 'Meet Adnan Hossain Khan, a software engineer building React and Laravel products, hotel booking systems, payment integrations, and AI image workflows.' },
      { property: 'og:title', content: 'About — Adnan Hossain Khan' },
    ],
    links: [{ rel: 'canonical', href: 'https://example.com/about' }],
  }),
  component: About,
})
