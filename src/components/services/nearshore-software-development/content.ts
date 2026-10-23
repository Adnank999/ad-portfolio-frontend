import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const nearshoreSoftwareDevelopmentContent: ServiceContent = {
  slug: "nearshore-software-development",
  category: "Software & product",
  title: "Remote Software Development Support",
  summary: "Add a hands-on developer to your delivery process, with clear ownership, reviewable code, and working hours agreed around your team.",
  artwork: "software",
  overview: {
    title: "Extra engineering capacity with a clear place in your team.",
    text: "You may have a feature waiting for development, an integration nobody has time to own, or a product backlog moving too slowly. I contribute directly to an existing team as an independent full-stack developer based in Bangladesh. If you are comparing nearshore partners, we first establish whether my location, availability, and working-hour overlap fit your needs.",
    definitions: [
      {
        title: "An individual contributor",
        text: "You work with me on an agreed area of the product. The scope reflects my availability and skills, with a named person on your side for decisions and review."
      },
      {
        title: "A working agreement",
        text: "We set expectations for access, communication, review windows, and delivery before onboarding. Geography alone does not establish how a collaboration will work."
      }
    ]
  },
  challenge: {
    title: "Make it easy for an outside developer to contribute.",
    before: [
      "Tickets arrive without enough product or technical context.",
      "Pull requests wait because review ownership is unclear.",
      "Knowledge leaves the team when a milestone ends."
    ],
    after: [
      "Start with the user problem, existing conventions, and acceptance criteria.",
      "Agree on a reviewer, a feedback window, and escalation for blockers.",
      "Keep setup notes, decisions, and operational details in your workspace."
    ]
  },
  offerings: {
    title: "Engineering support for the work already on your roadmap.",
    items: [
      {
        title: "React & TypeScript delivery",
        text: "Build responsive interfaces, account areas, and product features using your existing components and frontend patterns."
      },
      {
        title: "Laravel & API development",
        text: "Implement business logic, endpoints, validation, and background jobs with contracts the rest of the team can review."
      },
      {
        title: "Third-party integrations",
        text: "Own a defined provider connection, including data mapping, retries, limits, and failure handling."
      },
      {
        title: "End-to-end feature work",
        text: "Take a bounded feature through implementation, verification, pull-request review, and release preparation."
      },
      {
        title: "Codebase improvements",
        text: "Address an identified performance issue or maintenance problem without turning it into an unrelated rewrite."
      },
      {
        title: "Release & handover support",
        text: "Prepare release notes, setup guidance, and the technical context needed for another developer to continue the work."
      }
    ]
  },
  deliverables: {
    title: "Contributions your team can review and keep.",
    items: [
      {
        title: "An onboarding plan",
        text: "An initial backlog, access requirements, communication schedule, and agreed ownership of implementation, review, and release."
      },
      {
        title: "Reviewable increments",
        text: "Pull requests with a clear purpose, relevant checks, and notes explaining decisions or remaining limitations."
      },
      {
        title: "Continuity for your team",
        text: "Updated documentation, handover notes, and a visible status of finished work, open questions, and follow-up tasks."
      }
    ],
    acceptance: "Your team reviews each contribution against its definition of done. We look at accepted functionality, review turnaround, unresolved blockers, and the clarity of the handover when deciding whether the collaboration is working."
  },
  spotlight: {
    title: "Start with one well-defined milestone.",
    text: "A focused feature or integration gives us a practical way to establish the working relationship. It reveals how we communicate, how reviews happen, and what access is missing before we make a longer commitment.",
    points: [
      "One owner for product decisions",
      "A small, agreed first backlog",
      "A review of both delivery and collaboration"
    ]
  },
  sectors: [
    "Product teams",
    "SaaS businesses",
    "Web agencies",
    "Commerce platforms",
    "Internal engineering",
    "Integration-heavy products"
  ],
  tools: [
    "React",
    "TypeScript",
    "Laravel",
    "REST APIs",
    "Git workflows",
    "Issue tracking"
  ],
  approach: {
    title: "Where an independent developer can fit.",
    items: [
      {
        title: "A feature needs an owner",
        text: "Delegate a bounded piece of the product while your core team stays focused on its existing commitments."
      },
      {
        title: "An agency needs delivery support",
        text: "Add implementation capacity for a defined client milestone while retaining your own design, review, and client relationships."
      },
      {
        title: "An integration is holding up a release",
        text: "Assign the investigation and implementation to one contributor, with explicit inputs, dependencies, and acceptance checks."
      }
    ]
  },
  process: [
    "Discuss your product, stack, current backlog, expected capacity, and location. Confirm that the skills and working-hour overlap suit the collaboration.",
    "Review repository conventions, development setup, access needs, and the first task. Identify blockers before promising a delivery date.",
    "Agree on ownership, communication channels, review expectations, and a small initial milestone with a clear definition of done.",
    "Contribute through your issue tracker and repository. Share progress, raise blockers early, and deliver changes through your normal review process.",
    "Review the milestone and handover. Adjust priorities or capacity for further work only after checking availability and the team's needs."
  ],
  engagement: {
    title: "A defined contribution or an ongoing working rhythm.",
    items: [
      {
        title: "A delivery milestone",
        text: "A feature, integration, or technical improvement with an agreed outcome and review process."
      },
      {
        title: "Regular contribution",
        text: "A recurring allocation against a shared backlog, with capacity and communication expectations agreed in advance."
      },
      {
        title: "A focused investigation",
        text: "A bounded codebase review or technical spike that answers a question before the team commits to implementation."
      }
    ]
  },
  preparation: {
    title: "Bring a backlog item and your team's working hours.",
    text: "We can assess the fit without access to a private repository at the first conversation. A description of the stack, the work, and how your team reviews changes is enough to begin.",
    items: [
      "Your stack and the feature or problem you want help with",
      "Your location, required overlap, and expected weekly capacity",
      "Your onboarding, review, confidentiality, and release requirements"
    ]
  },
  faqTitle: "Questions about remote development support.",
  faqs: [
    {
      title: "Are you a nearshore agency or an individual developer?",
      text: "I am an independent developer based in Bangladesh. Whether that location is nearshore to you depends on where your team works. This service is a direct collaboration with me; staffing a larger team is outside the standard scope."
    },
    {
      title: "Can you work in our time zone?",
      text: "We agree on realistic overlap before starting. Planned meetings can be combined with written updates and review windows, but I do not assume full-day coverage in your time zone. Required hours and availability are part of the initial discussion."
    },
    {
      title: "Can you use our existing tools and coding conventions?",
      text: "Yes, where the stack and access requirements fit my experience. Onboarding covers your local setup, coding patterns, issue tracker, tests, pull-request process, and deployment responsibilities so contributions fit the codebase."
    },
    {
      title: "How much management will our team need to provide?",
      text: "I need a person who can clarify priorities and accept the work, plus access to technical context and review. The goal is ownership of a defined contribution, with blockers raised early rather than passed back as unexplained delays."
    },
    {
      title: "Can we begin with a small engagement?",
      text: "Yes. A clearly scoped first milestone is a useful way to assess code quality, communication, and review practices. Its deliverables and commercial terms are agreed before work starts."
    },
    {
      title: "How do you handle confidentiality and code ownership?",
      text: "We review confidentiality, intellectual property, repository access, and account requirements before sharing sensitive material. Those terms belong in the working agreement, along with the handover expected when the engagement ends."
    },
    {
      title: "How are fees and availability agreed?",
      text: "The arrangement depends on the scope, expected capacity, and duration. I confirm availability before committing, and we agree on how work is estimated, reported, and reviewed. Additional capacity is discussed explicitly."
    },
    {
      title: "What happens when the engagement finishes?",
      text: "Open work, implementation notes, setup instructions, and relevant decisions are handed back through your systems. We review any remaining questions and remove access according to your offboarding process."
    }
  ],
  related: [
    "custom-software-development",
    "web-development",
    "legacy-modernization"
  ],
  articles: [
    {
      title: "A practical onboarding brief for an external developer",
      text: "Share enough product context, setup guidance, and review expectations to make the first contribution useful."
    },
    {
      title: "Working-hour overlap is only part of collaboration",
      text: "Plan decisions, feedback windows, and written updates around the way your team actually delivers."
    },
    {
      title: "Make the handover useful before the final day",
      text: "Keep decisions and operational knowledge with the team throughout an engagement."
    }
  ]
};
