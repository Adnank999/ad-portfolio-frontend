export const capabilities = [
  {
    title: 'Interfaces that feel intuitive.',
    category: 'Frontend & interaction',
    description: 'Turn complex journeys into clear, responsive interfaces. I bring structure, accessibility, and thoughtful details together so the product feels natural on every screen.',
    tools: ['React', 'TypeScript', 'Tailwind CSS'],
    outcome: 'Clarity in every interaction',
    artwork: 'interface',
  },
  {
    title: 'A foundation you can build on.',
    category: 'Backend & architecture',
    description: 'Build the quieter side of a great experience: well-structured APIs, dependable data flows, and maintainable application logic that can evolve with the product.',
    tools: ['Laravel', 'PHP', 'MySQL', 'REST APIs'],
    outcome: 'Structure behind the experience',
    artwork: 'architecture',
  },
  {
    title: 'The right systems, connected.',
    category: 'APIs & integrations',
    description: 'Connect payments, supplier platforms, and third-party services without passing the complexity on to your users. Keep the handoffs considered and the data moving in the right direction.',
    tools: ['API integration', 'Payments', 'Background jobs'],
    outcome: 'Less friction between moving parts',
    artwork: 'connections',
  },
  {
    title: 'Faster where it matters.',
    category: 'Performance & optimization',
    description: 'Look beyond the first impression. Refine loading, caching, and media delivery to make everyday interactions feel lighter, without compromising the details that make the product yours.',
    tools: ['Redis', 'Caching', 'Media delivery'],
    outcome: 'A more responsive everyday experience',
    artwork: 'performance',
  },
  {
    title: 'Motion with a reason to move.',
    category: 'Creative development',
    description: 'Use transitions and subtle feedback to guide attention, explain changes, and add character. Every effect should serve the experience, with a calmer alternative for reduced motion.',
    tools: ['Framer Motion', 'Responsive design', 'Accessibility'],
    outcome: 'Character without distraction',
    artwork: 'motion',
  },
  {
    title: 'One coherent product.',
    category: 'Product & delivery',
    description: 'Bring the interface and the systems behind it into the same conversation. From a first working flow to the details around real-world use, build something that feels considered from front to back.',
    tools: ['Full-stack development', 'Integration', 'Refinement'],
    outcome: 'Considered as a whole, not in pieces',
    artwork: 'product',
  },
] as const

export type CapabilityArtworkKind = typeof capabilities[number]['artwork']

export function getCapabilityFocusIndex(current: number, key: string, count: number) {
  if (key === 'ArrowDown') return (current + 1) % count
  if (key === 'ArrowUp') return (current - 1 + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}
