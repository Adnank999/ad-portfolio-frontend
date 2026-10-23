import { Blocks, Braces, Cloud, Database, Sparkles } from 'lucide-react'

export const technologyGroups = [
  {
    id: 'frontend', name: 'Frontend', icon: Braces, position: { x: 50, y: 13 },
    title: 'Interfaces with purpose and a little personality.',
    description: 'From customer-facing travel flows to internal tools, I build responsive interfaces with JavaScript, TypeScript, and a component-driven approach.',
    connection: 'From semantic HTML and CSS to state, data, and interaction.',
    tools: [
      { name: 'React / Next.js', purpose: 'Component-driven interfaces and product experiences' },
      { name: 'Vue.js / Nuxt.js', purpose: 'Additional frontend frameworks in my toolkit' },
      { name: 'JavaScript / TypeScript', purpose: 'Interactive behavior and typed application code' },
      { name: 'TanStack Start / Router / Query', purpose: 'Application routing and server-state workflows' },
      { name: 'Redux Toolkit / RTK Query / Zustand', purpose: 'Application state and data fetching' },
      { name: 'GSAP / Framer Motion', purpose: 'Transitions and scroll-based interaction' },
    ],
  },
  {
    id: 'backend', name: 'Backend', icon: Blocks, position: { x: 83, y: 39 },
    title: 'Business rules that hold together.',
    description: 'Laravel and PHP anchor my production work: booking workflows, payments, secure APIs, and background services. I’m also developing my depth across other backend ecosystems.',
    connection: 'Connects product rules with external services and dependable background work.',
    tools: [
      { name: 'PHP / Laravel', purpose: 'Production applications and business workflows' },
      { name: 'Node.js / Express / NestJS', purpose: 'JavaScript backend frameworks' },
      { name: 'Java / Spring Boot', purpose: 'Growing my backend language and framework experience' },
      { name: 'REST APIs', purpose: 'API contracts, validation, and authentication' },
      { name: 'Stripe / Coinbase Commerce', purpose: 'Payment integrations and webhook confirmations' },
      { name: 'Kafka / RabbitMQ / queues', purpose: 'Messaging and asynchronous processing tools' },
    ],
  },
  {
    id: 'cloud', name: 'Cloud', icon: Cloud, position: { x: 71, y: 79 },
    title: 'From a working build to a reliable release.',
    description: 'From object storage and CDN integration to CI/CD pipelines, I care about how software reaches people and stays maintainable. My wider toolkit also spans cloud infrastructure and observability.',
    connection: 'Storage, deployment, and monitoring support the same product lifecycle.',
    tools: [
      { name: 'AWS / Amazon S3', purpose: 'Cloud services and scalable media storage' },
      { name: 'GCP / Azure / Oracle Cloud', purpose: 'Cloud platforms listed in my toolkit' },
      { name: 'DigitalOcean / Hetzner', purpose: 'Hosting and infrastructure platforms' },
      { name: 'Cloudflare', purpose: 'CDN integration and media delivery' },
      { name: 'Docker / Kubernetes', purpose: 'Container and orchestration tooling' },
      { name: 'GitHub Actions / CI/CD', purpose: 'Automated build and delivery pipelines' },
      { name: 'Grafana / Prometheus / Loki', purpose: 'Metrics, dashboards, and logs' },
    ],
  },
  {
    id: 'database', name: 'Database', icon: Database, position: { x: 29, y: 79 },
    title: 'Data that serves the workflow.',
    description: 'Relational modeling, efficient queries, and deliberate caching underpin the booking, payment, and internal applications I work on.',
    connection: 'Keep persistent records, application queries, and cache behavior working together.',
    tools: [
      { name: 'MySQL', purpose: 'Relational application data and business records' },
      { name: 'PostgreSQL', purpose: 'Relational schemas and transactional workflows' },
      { name: 'MongoDB', purpose: 'Document-oriented data modeling' },
      { name: 'Redis', purpose: 'Caching and background-processing infrastructure' },
      { name: 'Prisma / TypeORM', purpose: 'Typed database-access tooling' },
      { name: 'Hibernate / EF Core', purpose: 'Persistence tools across Java and .NET ecosystems' },
    ],
  },
  {
    id: 'ai', name: 'AI', icon: Sparkles, position: { x: 17, y: 39 },
    title: 'AI applied to real visual problems.',
    description: 'At VervTrip, I developed image classification for 6M+ hotel images across 400k+ hotels. At BZM Graphics, I built virtual try-on with open-source AI models.',
    connection: 'Connect model capabilities to image workflows, not just isolated demos.',
    tools: [
      { name: 'Gemini 2.5 Flash Lite', purpose: 'Large-scale hotel image classification' },
      { name: 'Open-source AI models', purpose: 'Virtual Try-On implementation' },
      { name: 'Image-classification pipelines', purpose: 'Organizing visual data for hotel experiences' },
      { name: 'Model API integration', purpose: 'Connecting AI processing to application workflows' },
      { name: 'Asynchronous processing', purpose: 'Background work for high-volume operations' },
    ],
  },
] as const
