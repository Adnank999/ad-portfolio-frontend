export const professionalProfile = {
  summary: 'Full-stack developer with 4+ years of experience connecting customer-facing interfaces with the backend systems that make them work. My focus is maintainable code, reliable integrations, application performance, and software people can depend on.',
  focus: 'React, TypeScript, Laravel, and PHP form the core of my work, alongside relational databases, REST APIs, background processing, cloud services, and applied AI.',
}

export const experience = [
  {
    company: 'VervTrip',
    role: 'Full-Stack Developer',
    period: 'October 2025 — Present',
    location: 'London, United Kingdom',
    summary: 'Building the systems behind hotel bookings and airport transfers: supplier integrations, real-time search, payments, queues, and the customer experience that connects them.',
    highlights: [
      'Develop and maintain customer-facing applications with Laravel, PHP, React, and TypeScript, including flexible checkout and complex booking workflows.',
      'Developed an AI image-classification pipeline processing 6M+ hotel images across 400k+ hotels using Gemini 2.5 Flash Lite.',
      'Build responsive hotel search using Server-Sent Events (SSE), optimized data streaming, supplier APIs, and Redis-based caching.',
      'Integrate Stripe, Coinbase Commerce, Google Maps, Cloudflare, and hotel suppliers, with payment validation, authentication, and webhook-based confirmations.',
      'Design backend services, database queries, background jobs, and queue processing to support high-volume operations.',
      'Develop automated cashback and wallet functionality covering campaign rules, transaction processing, fraud detection, and analytics.',
      'Improve performance through database and API optimization, caching, CDN integration, and asynchronous processing; collaborate across implementation, testing, and deployment.',
    ],
    technologies: ['Laravel', 'PHP', 'React', 'TypeScript', 'Redis', 'SSE', 'Gemini', 'Stripe', 'Coinbase Commerce'],
  },
  {
    company: 'BZM Graphics',
    role: 'Full-Stack Developer',
    period: 'October 2024 — October 2025',
    location: 'Dhaka, Bangladesh',
    summary: 'Built media-heavy applications and internal business tools, combining cloud storage, real-time updates, automated delivery, and AI-powered visual experiences.',
    highlights: [
      'Developed a scalable image-upload platform backed by Amazon S3.',
      'Implemented real-time notifications with Pusher and efficient bulk file downloads with ZipStream.',
      'Built and maintained CI/CD pipelines with GitHub Actions.',
      'Customized ERP and HRM systems around specific business requirements.',
      'Built a Virtual Try-On system using open-source AI models.',
    ],
    technologies: ['Amazon S3', 'Pusher', 'GitHub Actions', 'ZipStream', 'ERP / HRM', 'Open-source AI'],
  },
  {
    company: 'ChatChef',
    role: 'Frontend Developer',
    period: 'December 2022 — September 2024',
    location: 'Canada',
    summary: 'Turned product requirements into responsive React and Next.js interfaces, with a focus on state management, real-time feedback, performance, and interaction design.',
    highlights: [
      'Built responsive interfaces with React.js and Next.js for desktop, tablet, and mobile.',
      'Managed application state and data fetching with Redux Toolkit and RTK Query.',
      'Optimized application performance and reduced API latency.',
      'Created interactive animations and transitions with Framer Motion and GSAP.',
      'Integrated Google Maps APIs with cost-optimization strategies and real-time notifications with Firebase.',
    ],
    technologies: ['React', 'Next.js', 'Redux Toolkit', 'RTK Query', 'Framer Motion', 'GSAP', 'Google Maps', 'Firebase'],
  },
] as const

export const education = {
  institution: 'Daffodil International University',
  qualification: 'B.Sc. in Electronics and Telecommunication Engineering',
  period: '2015 — 2019',
  location: 'Dhaka, Bangladesh',
}
