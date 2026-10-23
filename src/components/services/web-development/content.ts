import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const webDevelopmentContent: ServiceContent = {
  slug: "web-development",
  category: "Software & product",
  title: "Custom Web Development Services",
  summary: "Turn visitors into enquiries, bookings, and customers with a fast, accessible website that connects to the tools behind your business.",
  artwork: "web",
  overview: {
    title: "A website should make the next step easy.",
    text: "Your website is often where someone decides whether to contact you, buy from you, or keep looking. I design and build websites that explain your offer clearly and help visitors complete that decision. From a service website to a customer portal, the work connects content, interface design, and the systems that need to respond when someone takes action.",
    definitions: [
      {
        title: "A public face for your business",
        text: "For service pages, launches, and content sites, the priority is a clear message, useful navigation, and a straightforward path to an enquiry or purchase."
      },
      {
        title: "A place to get things done",
        text: "For portals and web applications, the priority is the task: sign in, find information, make a booking, manage an account, or complete a workflow."
      }
    ]
  },
  challenge: {
    title: "Make every visit easier to complete.",
    before: [
      "Visitors have to piece together what you offer and who it is for.",
      "Slow pages, awkward mobile forms, or broken handoffs interrupt enquiries.",
      "Simple content updates require a developer to edit several pages."
    ],
    after: [
      "Page structure follows the questions visitors ask before taking action.",
      "Important journeys are checked across mobile, desktop, keyboard, and error states.",
      "Reusable page patterns and an agreed editing workflow simplify ongoing changes."
    ]
  },
  offerings: {
    title: "Web development from the first page to the final handoff.",
    items: [
      {
        title: "Business & marketing websites",
        text: "Service pages, product launches, and company websites with a clear content hierarchy, responsive layouts, and focused calls to action."
      },
      {
        title: "Customer portals",
        text: "Account areas, dashboards, and self-service tools with role-based access, understandable navigation, and useful loading and empty states."
      },
      {
        title: "Booking & commerce journeys",
        text: "Product browsing, availability, checkout, and confirmation flows connected to the providers your business uses."
      },
      {
        title: "Content management",
        text: "Reusable templates and structured content fields so editors can publish consistently without changing the layout each time."
      },
      {
        title: "Forms & integrations",
        text: "Connect enquiries, payments, and bookings to your CRM or backend, with validation and a recovery path when a provider fails."
      },
      {
        title: "Website improvements",
        text: "Investigate slow templates, confusing journeys, accessibility barriers, and maintenance problems in an existing website."
      }
    ]
  },
  deliverables: {
    title: "A website you can launch, use, and maintain.",
    items: [
      {
        title: "Page & content plan",
        text: "An agreed sitemap, key visitor journeys, reusable page types, and a list of content needed before launch."
      },
      {
        title: "Tested website",
        text: "The scoped pages and integrations, with responsive checks, keyboard testing, form validation, and a record of any known limitations."
      },
      {
        title: "Launch & editing handover",
        text: "Deployment instructions, editing guidance, redirect requirements for replaced pages, and clear ownership of hosting and ongoing maintenance."
      }
    ],
    acceptance: "We walk through the agreed visitor journeys on representative devices: finding a service, submitting a valid enquiry, recovering from an error, or completing a booking. Launch readiness includes content approval and integration checks."
  },
  spotlight: {
    title: "Connect the enquiry to what happens next.",
    text: "A successful form submission should reach the right person with enough context to respond. I plan the full journey, including confirmation messages, CRM delivery, failed submissions, and the information your team needs to follow up.",
    points: [
      "Clear actions on the pages that matter",
      "Useful confirmation and error messages",
      "A defined destination for every enquiry or booking"
    ]
  },
  sectors: [
    "Service businesses",
    "SaaS products",
    "Retail & commerce",
    "Travel & hospitality",
    "Education",
    "Content publishers"
  ],
  tools: [
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Laravel",
    "REST APIs",
    "Content management"
  ],
  approach: {
    title: "Start with the change your visitors need.",
    items: [
      {
        title: "Launching a new offer",
        text: "Turn an agreed service or product proposition into pages that explain the value, answer likely questions, and provide a direct next step."
      },
      {
        title: "Replacing a difficult website",
        text: "Keep useful content and URLs where practical, simplify navigation, and plan redirects for pages that move."
      },
      {
        title: "Adding self-service",
        text: "Give customers a place to manage information or requests while connecting their actions to the existing business workflow."
      }
    ]
  },
  process: [
    "Discuss your audience, the main action visitors should take, existing content, and the people who will maintain the site. Agree on the first release and its boundaries.",
    "Review the current site or brief, identify missing content, and check integration access, hosting constraints, and the journeys that need the most attention.",
    "Plan page structure and prototype the important screens. Agree on reusable components, mobile behavior, editing needs, and acceptance checks.",
    "Build the pages and integrations in reviewable stages. Check forms, permissions, keyboard use, responsive layouts, metadata, and production configuration before launch.",
    "Complete the handover and review the first feedback. Any further improvements or maintenance follow an agreed backlog and support arrangement."
  ],
  engagement: {
    title: "Choose the next useful website release.",
    items: [
      {
        title: "A focused website",
        text: "A defined set of marketing or service pages, with content responsibilities and a practical launch checklist."
      },
      {
        title: "A connected web application",
        text: "A phased build for accounts, bookings, customer workflows, or integrations that need more than a public website."
      },
      {
        title: "An improvement sprint",
        text: "A prioritized set of fixes for an existing site, with clear before-and-after checks for the issues being addressed."
      }
    ]
  },
  preparation: {
    title: "Bring your goal, your content, and one important journey.",
    text: "A finished specification is not required. A description of who visits the site and what they should do gives us a useful starting point. These details help me assess the scope and identify missing decisions.",
    items: [
      "Your current website or a short description of the new offer",
      "The pages, content, and brand assets you already have",
      "Required integrations, target launch date, and budget range"
    ]
  },
  faqTitle: "Web development questions, answered.",
  faqs: [
    {
      title: "Can you redesign my existing website?",
      text: "Yes. I begin with the content, URLs, features, and integrations that need to stay. The redesign scope then covers what changes, how existing pages are redirected, and how the new site will be reviewed before replacing the current one."
    },
    {
      title: "Will the website work on mobile and with a keyboard?",
      text: "Responsive layouts and keyboard checks are part of the implementation. We agree on the important browsers and devices, then check navigation, forms, focus states, and content at those sizes. A formal accessibility audit can be scoped if you need one."
    },
    {
      title: "Can I update the website myself?",
      text: "Yes, when content management is included. We identify which areas need editing, who will publish, and whether changes require approval. The handover covers those tasks so routine updates do not depend on remembering how the code works."
    },
    {
      title: "Can you work from an existing design?",
      text: "Yes. I can build from supplied designs after checking responsive states, interactions, content, and reusable patterns. Missing error, empty, or mobile states are clarified before implementation so the build has a complete set of requirements."
    },
    {
      title: "Can the website connect to my CRM, booking system, or payment provider?",
      text: "I review the provider's supported interfaces, account access, and test environment first. The integration scope includes field mapping, successful and failed requests, and who resolves exceptions after launch."
    },
    {
      title: "What determines the price and delivery schedule?",
      text: "The main factors are page templates, content readiness, custom interactions, integrations, and review cycles. I use those details to propose milestones and a fee. Hosting, licenses, and other third-party costs are identified separately."
    },
    {
      title: "Is SEO included in the build?",
      text: "The build can include descriptive metadata, semantic headings, crawlable links, and an agreed redirect plan. Keyword research, ongoing content work, and a wider technical SEO engagement are separate scope decisions."
    },
    {
      title: "What happens after launch?",
      text: "You receive the agreed deployment and editing handover. We also define who handles hosting, updates, backups, and incoming issues. Ongoing maintenance or additional features can be arranged separately with explicit availability and response expectations."
    }
  ],
  related: [
    "custom-software-development",
    "seo",
    "crm-implementation"
  ],
  projectSlugs: [
    "hotel-booking-platform",
    "commerce-studio"
  ],
  articles: [
    {
      title: "What belongs in a useful website brief?",
      text: "Define your audience, key journeys, content responsibilities, and launch requirements before designing the first screen."
    },
    {
      title: "The enquiry journey after the submit button",
      text: "Plan confirmations, CRM delivery, and failure handling so useful enquiries reach the people who need them."
    },
    {
      title: "Redesigning without losing useful pages",
      text: "Inventory content and URLs, plan redirects, and decide what should survive the move to a new website."
    }
  ]
};
