import { createFileRoute } from '@tanstack/react-router'
import { Experience } from '@/components/sections/Experience'

export const Route = createFileRoute('/experience')({
  head: () => ({
    meta: [
      { title: 'Experience — Adnan Hossain Khan' },
      { name: 'description', content: 'Explore Adnan Hossain Khan’s experience at VervTrip, BZM Graphics, and ChatChef: full-stack development, booking and payment systems, cloud media, and applied AI.' },
      { property: 'og:title', content: 'Experience — Adnan Hossain Khan' },
    ],
    links: [{ rel: 'canonical', href: 'https://example.com/experience' }],
  }),
  component: Experience,
})
