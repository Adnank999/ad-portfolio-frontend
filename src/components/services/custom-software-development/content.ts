import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const customSoftwareDevelopmentContent: ServiceContent = {
  slug: "custom-software-development",
  category: "Software & product",
  title: "Custom Software Development",
  summary: "Build a product, internal tool, or business platform around your actual workflow, with a clear first release and room to grow.",
  artwork: "software",
  overview: {
    title: "Software shaped around the work you need to do.",
    text: "When spreadsheets, disconnected tools, or repeated workarounds start to limit a process, custom software can bring it into one usable system. I work with you to define the users, business rules, and integrations, then build a focused release that solves an identifiable problem. The aim is software your team can use, support, and change as the business develops.",
    definitions: [
      {
        title: "A product for your customers",
        text: "Build the core experience of a SaaS product, customer platform, or booking service around the job people need to complete."
      },
      {
        title: "A tool for your operation",
        text: "Give your team a shared workspace for requests, approvals, records, or reporting that existing software cannot handle cleanly."
      }
    ]
  },
  challenge: {
    title: "Turn hidden business rules into dependable workflows.",
    before: [
      "Important decisions live in spreadsheets, inboxes, or one person's memory.",
      "Teams re-enter the same data because existing tools do not connect.",
      "A growing feature list makes the first release difficult to finish."
    ],
    after: [
      "Capture rules, roles, and exceptions before implementing them.",
      "Give each record an owner and each integration a clear responsibility.",
      "Define a complete first workflow with explicit acceptance criteria."
    ]
  },
  offerings: {
    title: "Custom software for customers and the teams behind them.",
    items: [
      {
        title: "Product discovery & MVPs",
        text: "Define the smallest release that can test a useful product assumption, including the core journey and a way to collect feedback."
      },
      {
        title: "SaaS applications",
        text: "Build accounts, permissions, workspaces, subscriptions, and administrative tools around the product's actual requirements."
      },
      {
        title: "Internal business tools",
        text: "Replace repeated manual work with focused screens for requests, approvals, scheduling, or record management."
      },
      {
        title: "Backend systems & APIs",
        text: "Implement business rules, validation, background jobs, and documented interfaces for the applications that depend on them."
      },
      {
        title: "System integrations",
        text: "Connect external providers with clear data mappings, error handling, retry behavior, and visibility into failed operations."
      },
      {
        title: "Existing product development",
        text: "Add capabilities, improve performance, or simplify difficult parts of a live application through bounded changes."
      }
    ]
  },
  deliverables: {
    title: "A working release with the knowledge to maintain it.",
    items: [
      {
        title: "Defined release scope",
        text: "User journeys, business rules, data relationships, integration assumptions, and acceptance criteria for the agreed milestone."
      },
      {
        title: "Application & verification",
        text: "The scoped source code and configuration, relevant automated checks, and a reviewed walkthrough of complete user workflows."
      },
      {
        title: "Technical handover",
        text: "Setup and deployment guidance, environment requirements, interface documentation, and a prioritized list of remaining work."
      }
    ],
    acceptance: "We validate complete tasks using representative data and user roles. Acceptance covers normal use, permission boundaries, important failure cases, and the agreed operational checks rather than a feature count alone."
  },
  spotlight: {
    title: "Build the first complete workflow.",
    text: "For a request-management tool, that might mean submission, review, approval, and a recorded outcome. Completing one coherent journey gives users something useful to test and exposes missing rules before the project expands.",
    points: [
      "One clearly defined user problem",
      "A complete journey through the system",
      "Feedback that informs the next release"
    ]
  },
  sectors: [
    "SaaS products",
    "Travel platforms",
    "Commerce operations",
    "Service teams",
    "Logistics",
    "Internal operations"
  ],
  tools: [
    "React",
    "TypeScript",
    "Laravel",
    "SQL",
    "Redis",
    "REST APIs"
  ],
  approach: {
    title: "Three practical starting points for a custom build.",
    items: [
      {
        title: "A spreadsheet has become a system",
        text: "Turn shared records and approval rules into a controlled workspace with permissions, validation, and a reliable history of changes."
      },
      {
        title: "A product idea needs a first release",
        text: "Identify the main customer task, test the riskiest assumptions, and choose the capabilities needed to support an initial user group."
      },
      {
        title: "Existing software leaves a gap",
        text: "Build an integration or focused extension around the tools already in use, with clear boundaries and maintenance responsibilities."
      }
    ]
  },
  process: [
    "Map users, recurring tasks, business rules, and the outcome the software needs to support. Compare a custom build with adapting tools you already have.",
    "Review data, integration access, operational constraints, and uncertain requirements. Identify what needs a small technical investigation before estimating the build.",
    "Design the first release: journeys, screens, data model, permissions, and API contracts. Agree on acceptance criteria and the order of delivery.",
    "Implement and review working increments. Check representative workflows, edge cases, access rules, and deployment requirements before release.",
    "Hand over the code and operating knowledge. Use feedback and observed issues to prioritize maintenance and the next release."
  ],
  engagement: {
    title: "A clear boundary for each stage of the build.",
    items: [
      {
        title: "Discovery & feasibility",
        text: "Resolve uncertain requirements or integration risks and leave with a proposed architecture and release plan."
      },
      {
        title: "A product milestone",
        text: "Deliver an agreed workflow or release with defined users, acceptance criteria, and a handover."
      },
      {
        title: "Ongoing product development",
        text: "Work through a prioritized backlog with regular reviews, explicit scope decisions, and capacity agreed in advance."
      }
    ]
  },
  preparation: {
    title: "Show me how the work happens today.",
    text: "A walkthrough of the current process is often more useful than a long feature list. It helps reveal where the rules live, which steps need judgment, and what a useful first version should accomplish.",
    items: [
      "A sample workflow, spreadsheet, or existing application",
      "The users involved and the rules they need to follow",
      "The first outcome you need, plus budget and timing constraints"
    ]
  },
  faqTitle: "Questions about building custom software.",
  faqs: [
    {
      title: "Should I build custom software or use an existing product?",
      text: "We compare the workflow fit, integration effort, licensing, and ongoing ownership costs. An existing product may cover most of the need. Custom development makes sense when a specific requirement justifies the cost of building and maintaining it."
    },
    {
      title: "Can we start with an MVP?",
      text: "Yes. We define the assumption the MVP needs to test and a complete journey for its first users. Features that do not support that learning can wait, while essential permissions, data handling, and operational needs stay in scope."
    },
    {
      title: "Can you take over an existing application?",
      text: "I start with a review of the stack, code structure, dependencies, deployment, and current issues. That review establishes whether I can contribute effectively and what must be addressed before committing to new features."
    },
    {
      title: "Who owns the source code and accounts?",
      text: "Code ownership, usage rights, and account access are recorded in the agreement before work begins. The handover identifies third-party licenses, services, and dependencies so you can understand what you own and what needs an ongoing subscription."
    },
    {
      title: "How do you handle changing requirements?",
      text: "We keep a visible backlog and discuss changes against the current milestone. If a new requirement affects cost, timing, or another feature, we agree on the trade-off before treating it as part of the delivery commitment."
    },
    {
      title: "How is quality checked?",
      text: "Checks follow the risk and scope of the application: relevant automated tests, manual workflow reviews, permission checks, and deployment validation. You review working software against agreed acceptance criteria throughout the build."
    },
    {
      title: "How are cost and timing estimated?",
      text: "The estimate depends on workflows, integrations, data complexity, and unresolved decisions. For uncertain projects, a discovery phase can establish a realistic first milestone. Larger builds are split into releases that can be estimated and reviewed individually."
    },
    {
      title: "Can you maintain the software after delivery?",
      text: "Maintenance and further development can be agreed separately. The arrangement should define availability, issue reporting, release responsibilities, and the difference between correcting an issue and adding a new capability."
    }
  ],
  related: [
    "web-development",
    "ai-automation",
    "digital-transformation"
  ],
  projectSlugs: [
    "hotel-booking-platform",
    "saas-command-center"
  ],
  articles: [
    {
      title: "Define an MVP around one complete task",
      text: "Choose the journey that proves the product's value and decide what can wait until the next release."
    },
    {
      title: "Finding business rules inside a spreadsheet",
      text: "Turn formulas, exceptions, and informal approvals into requirements people can review."
    },
    {
      title: "What a useful software handover includes",
      text: "Go beyond the repository with setup instructions, deployment knowledge, and clear operating responsibilities."
    }
  ]
};
