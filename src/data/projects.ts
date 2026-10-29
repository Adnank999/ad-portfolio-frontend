export type ProjectMedia = {
  type: 'image' | 'video'
  src: string
  alt: string
  caption?: string
  poster?: string
  thumbnail?: string
  layout?: 'small' | 'large'
}

export type Project = {
  id: string
  slug: string
  title: string
  description: string
  image: string
  imageAlt?: string
  media?: ProjectMedia[]
  category: string
  year: string
  technologies: string[]
  githubUrl: string
  liveUrl: string
  featured?: boolean
  overview: string
  problem: string
  solution: string
  features: string[]
  technical: string
  challenges: string
  results: string
}

// Legacy case-study seeds and test fixtures. Public project views load the Rust API.
export const projects: Project[] = [
  {
    id: '1', slug: 'hotel-booking-platform', title: 'Hotel Booking Platform', category: 'Travel / SaaS', year: '2026',
    description: 'A high-performance hotel discovery and booking experience with supplier integrations, flexible payments, and a modern search flow.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',
    technologies: ['Laravel', 'React', 'TypeScript', 'Inertia', 'Redis'], githubUrl: '#', liveUrl: '#', featured: true,
    overview: 'A full-stack travel platform designed around fast hotel discovery, supplier inventory, and a frictionless checkout journey.',
    problem: 'Travel inventory is fragmented, image-heavy, and latency-sensitive. Users need useful results quickly without sacrificing booking flexibility.',
    solution: 'A server-rendered application combines provider APIs, caching, streamed search results, optimized media delivery, and a modular booking pipeline.',
    features: ['Supplier inventory aggregation', 'Streaming hotel search', 'Pay now / pay later checkout', 'Wallet and cashback flows', 'Optimized hotel imagery', 'Provider-aware booking orchestration'],
    technical: 'Laravel powers the application and integrations while React and Inertia provide a rich interface. Redis is used for caching and queues, with a strong focus on resilient external API boundaries.',
    challenges: 'The biggest challenge is balancing fresh provider inventory with response speed while keeping downstream supplier failures isolated from the customer experience.',
    results: 'Designed as a scalable foundation where new suppliers, destinations, payment providers, and customer features can be added without rebuilding the core booking flow.',
  },
  {
    id: '2', slug: 'saas-command-center', title: 'SaaS Command Center', category: 'SaaS / Analytics', year: '2026',
    description: 'A focused analytics workspace that turns operational data into clear dashboards, alerts, and actionable workflows.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=85',
    technologies: ['React', 'TypeScript', 'Tailwind', 'REST API'], githubUrl: '#', liveUrl: '#',
    overview: 'A polished SaaS dashboard concept for teams that need a single place to understand operational health.',
    problem: 'Important metrics often live across disconnected tools and are difficult to scan quickly.', solution: 'A modular dashboard groups critical metrics into visual cards, trends, activity streams, and contextual actions.',
    features: ['Metric dashboards', 'Activity feed', 'Alerts', 'Responsive data tables', 'Workspace navigation'], technical: 'A component-driven React interface consumes typed API responses and uses reusable visualization primitives.', challenges: 'Making dense information feel calm and approachable without hiding important details.', results: 'A clean information architecture that scales naturally as more dashboards and workflows are introduced.',
  },
  {
    id: '3', slug: 'commerce-studio', title: 'Commerce Studio', category: 'E-commerce', year: '2025',
    description: 'A conversion-focused commerce interface with product discovery, rich product pages, and a streamlined cart experience.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind'], githubUrl: '#', liveUrl: '#',
    overview: 'An editorial-style commerce experience designed to make product discovery feel premium.', problem: 'Traditional storefronts can feel crowded and make comparison difficult.', solution: 'Large imagery, restrained typography, contextual filters, and progressive disclosure keep the shopping journey focused.',
    features: ['Product discovery', 'Responsive product gallery', 'Cart interactions', 'Search and filtering', 'Mobile-first checkout'], technical: 'Reusable React components and typed product models keep the UI flexible for multiple catalog layouts.', challenges: 'Maintaining rich imagery without compromising perceived speed.', results: 'A storefront system designed for future experimentation and content-led merchandising.',
  },
  {
    id: '4', slug: 'ai-vision-lab', title: 'AI Vision Lab', category: 'AI / Developer Tool', year: '2026',
    description: 'A visual workspace for classifying large image collections with review queues, confidence scores, and batch workflows.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85',
    technologies: ['Laravel', 'React', 'AI APIs', 'Redis'], githubUrl: '#', liveUrl: '#',
    overview: 'A developer-focused interface for large-scale image classification and human review workflows.', problem: 'Millions of images require automation, but uncertain classifications still need fast human review.', solution: 'Batch processing, confidence thresholds, review queues, and clear image provenance turn classification into an auditable workflow.',
    features: ['Batch classification', 'Confidence filtering', 'Review queue', 'Spend monitoring', 'Provider switching'], technical: 'The architecture separates ingestion, classification, persistence, and review so model providers can be changed without rewriting the workflow.', challenges: 'Managing throughput and cost while keeping results traceable.', results: 'A foundation for reliable large-scale visual data processing.',
  },
  {
    id: '5', slug: 'developer-observatory', title: 'Developer Observatory', category: 'Developer Experience', year: '2025',
    description: 'A dark, high-signal monitoring interface for application health, queues, deployments, and infrastructure events.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85',
    technologies: ['React', 'TypeScript', 'Charts', 'WebSockets'], githubUrl: '#', liveUrl: '#',
    overview: 'A monitoring interface designed for engineers who need signal without visual noise.', problem: 'Operational dashboards often overload engineers with simultaneous charts and alerts.', solution: 'Prioritized metrics, compact cards, contextual timelines, and clear states make important changes easier to spot.',
    features: ['Live system status', 'Queue monitoring', 'Deployment timeline', 'Incident states', 'Metric drill-downs'], technical: 'The UI is built around small composable panels that can subscribe to live data independently.', challenges: 'Creating a dense monitoring experience that still feels calm.', results: 'A scalable dashboard pattern for operational tooling.',
  },
  {
    id: '6', slug: 'travel-explorer', title: 'Travel Explorer', category: 'Travel / Discovery', year: '2025',
    description: 'A visual destination discovery experience combining editorial content, activities, and stay inspiration.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
    technologies: ['React', 'TypeScript', 'Maps', 'Tailwind'], githubUrl: '#', liveUrl: '#',
    overview: 'A destination-first travel experience where visual discovery leads naturally into planning.', problem: 'Travel planning can become fragmented between inspiration, activities, and accommodation.', solution: 'A unified destination experience connects editorial content with stays and activities.',
    features: ['Destination discovery', 'Activity cards', 'Stay recommendations', 'Map exploration', 'Responsive galleries'], technical: 'Content and destination data are modeled independently so editorial and transactional content can evolve separately.', challenges: 'Balancing immersive photography with fast navigation.', results: 'A flexible foundation for a modern travel discovery product.',
  },
]

export function getProject(slug: string) { return projects.find((project) => project.slug === slug) }
