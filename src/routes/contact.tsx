import { createFileRoute } from '@tanstack/react-router'
import { Contact } from '@/components/sections/Contact'

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Contact — Adnan Hossain Khan' },
      { name: 'description', content: 'Get in touch with Adnan Hossain Khan about full stack development, products, platforms and web applications.' },
      { property: 'og:title', content: 'Contact — Adnan Hossain Khan' },
    ],
    links: [{ rel: 'canonical', href: 'https://example.com/contact' }],
  }),
  component: Contact,
})
