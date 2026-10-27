import { createFileRoute } from '@tanstack/react-router'
import { Contact } from '@/components/sections/Contact'
import { siteUrl } from '@/lib/siteUrl'

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Contact — Adnan Hossain Khan' },
      { name: 'description', content: 'Have a website, product or workflow in mind? Share your project brief with Adnan Hossain Khan and explore the next step together.' },
      { property: 'og:title', content: 'Contact — Adnan Hossain Khan' },
    ],
    links: [{ rel: 'canonical', href: siteUrl('/contact') }],
  }),
  component: Contact,
})
