import type { Industry } from "./types";

export const industries: Industry[] = [
  {
    slug: "manufacturing", name: "Manufacturing", artwork: "automation",
    description: "Production teams need dependable information across work orders, quality checks, and maintenance. Explore a concept for making the next operational action clearer.",
    perspective: "Manufacturing software should account for exceptions, traceability, and the people using it on the floor. A practical starting point is connecting one workflow with explicit ownership—not attempting to digitize every process at once.",
    audiences: ["Production teams", "Quality operations", "Maintenance planners", "Industrial suppliers"], priorities: ["Work-order visibility", "Quality checkpoints", "Traceable handoffs"], related: ["logistics", "retail-ecommerce", "technology-saas"],
  },
  {
    slug: "retail-ecommerce", name: "Retail & E-commerce", artwork: "web",
    description: "A storefront connects discovery, comparison, and buying decisions. Explore an existing commerce portfolio project designed around a clearer shopping experience.",
    perspective: "Retail experiences need more than a striking product grid. Content, stock information, navigation, and checkout should reinforce the same customer journey. The technical foundation needs to support that experience without making ordinary changes difficult.",
    audiences: ["Online retailers", "Product brands", "Specialist stores", "Commerce teams"], priorities: ["Product discovery", "Mobile shopping", "Manageable merchandising"], related: ["logistics", "technology-saas", "hospitality-real-estate"],
  },
  {
    slug: "healthcare", name: "Healthcare", artwork: "systems",
    description: "Administrative healthcare workflows need clear permissions, careful data handling, and reliable handoffs. This concept explores service coordination—not clinical decision-making.",
    perspective: "Healthcare technology should make operational responsibilities visible while respecting sensitive information. Any production deployment requires its own security, privacy, clinical-safety, and applicable compliance review. A portfolio concept is not evidence of certification or clinical validation.",
    audiences: ["Practice administrators", "Scheduling teams", "Service coordinators", "Operations managers"], priorities: ["Role-based access", "Administrative coordination", "Audit-ready workflows"], related: ["education", "non-profits", "technology-saas"],
  },
  {
    slug: "education", name: "Education", artwork: "software",
    description: "Learning operations involve schedules, resources, requests, and different user roles. Explore a concept for connecting those everyday administrative tasks.",
    perspective: "Education platforms need to remain understandable as terms, staff, and cohorts change. Clear roles and maintainable content workflows can be more valuable than a long feature list. Accessibility and careful handling of learner information belong in the initial requirements.",
    audiences: ["Schools", "Training providers", "Course administrators", "Learning communities"], priorities: ["Accessible interfaces", "Clear learner journeys", "Maintainable administration"], related: ["non-profits", "media-publishing", "technology-saas"],
  },
  {
    slug: "hospitality-real-estate", name: "Hospitality & Real Estate", artwork: "web",
    description: "Explore travel portfolio projects connecting inspiration, accommodation discovery, supplier information, and the path toward a booking.",
    perspective: "Travel and property experiences balance rich content with changing availability and external dependencies. Fast discovery matters, but so does explaining what happens when a provider is slow or a booking cannot proceed. These studies focus on the travel side of this broader industry.",
    audiences: ["Accommodation discovery", "Travel planning", "Booking operations", "Property content teams"], priorities: ["Visual discovery", "Supplier boundaries", "Clear booking states"], related: ["retail-ecommerce", "technology-saas", "logistics"],
  },
  {
    slug: "media-publishing", name: "Media & Publishing", artwork: "web",
    description: "Editorial teams need publishing tools that make ownership, review, and content changes understandable. Explore a concept for a calmer newsroom workflow.",
    perspective: "A content platform is also an operational system. Drafts, permissions, review stages, and publication history need to fit the editorial process. A well-designed workflow can make changing tools less disruptive without forcing every publication into the same model.",
    audiences: ["Editorial teams", "Digital publications", "Content studios", "Subscription publishers"], priorities: ["Review workflows", "Content structure", "Publication visibility"], related: ["music-entertainment", "education", "technology-saas"],
  },
  {
    slug: "music-entertainment", name: "Music & Entertainment", artwork: "data",
    description: "Shows, content releases, and artist operations bring together people, deadlines, and moving information. Explore a concept for coordinating an event workflow.",
    perspective: "Entertainment software should support the activity behind the experience: scheduling, collaborator access, release information, and operational visibility. The starting point is a specific workflow, not an assumption that every organization needs a new ticketing platform.",
    audiences: ["Event organizers", "Independent artists", "Production coordinators", "Creative teams"], priorities: ["Event coordination", "Shared schedules", "Clear collaborator access"], related: ["media-publishing", "retail-ecommerce", "technology-saas"],
  },
  {
    slug: "technology-saas", name: "Technology & SaaS", artwork: "software",
    description: "Explore existing portfolio work across operational analytics, AI-assisted review, and developer tooling—with an emphasis on useful information and clear states.",
    perspective: "Technical products can be powerful without overwhelming their users. Effective interfaces expose the right context, make failure states understandable, and keep important actions predictable. These portfolio studies explore those concerns through focused product workflows.",
    audiences: ["SaaS product teams", "Developer tools", "AI-enabled products", "Engineering operations"], priorities: ["Readable operational data", "Clear system states", "Composable interfaces"], related: ["retail-ecommerce", "manufacturing", "media-publishing"],
  },
  {
    slug: "logistics", name: "Logistics", artwork: "cloud",
    description: "Dispatch and fulfillment depend on coordinated handoffs. Explore a concept for tracing shipment events, exceptions, and the next action in one workspace.",
    perspective: "Logistics software needs to represent uncertainty rather than hide it. Missing scans, late handoffs, and conflicting updates are part of the workflow. An effective operations interface explains what is known, what needs checking, and who owns the next step.",
    audiences: ["Dispatch teams", "Fulfillment operations", "Warehouse coordinators", "Delivery support"], priorities: ["Exception management", "Event traceability", "Operational ownership"], related: ["manufacturing", "retail-ecommerce", "technology-saas"],
  },
  {
    slug: "non-profits", name: "Non-Profits", artwork: "systems",
    description: "Small teams often manage programs, supporters, and reporting across disconnected tools. Explore a concept for a focused community-program workspace.",
    perspective: "Non-profit technology should respect limited capacity and the sensitivity of the information it holds. Clear workflows, selective data collection, and understandable reporting can be a more sustainable starting point than a complex all-in-one platform.",
    audiences: ["Community organizations", "Program coordinators", "Volunteer teams", "Fundraising operations"], priorities: ["Practical administration", "Responsible data handling", "Transparent reporting"], related: ["education", "healthcare", "media-publishing"],
  },
];

export function getIndustry(slug: string) {
  return industries.find((industry) => industry.slug === slug);
}
