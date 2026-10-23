import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const digitalTransformationContent: ServiceContent = {
  slug: "digital-transformation",
  category: "Business systems",
  title: "Digital Transformation Consulting",
  summary: "Turn disconnected tools and manual handoffs into a practical improvement plan, then build the first change your team can put to use.",
  artwork: "systems",
  overview: {
    title: "Start with the way work moves through your business.",
    text: "When the same information is entered several times or a handoff depends on chasing a message, the problem often crosses more than one tool. I help map the process, identify the points of friction, and connect a realistic improvement plan to implementation. The starting point can be one operational workflow, with responsibilities and measures agreed before choosing new software.",
    definitions: [
      {
        title: "An operating problem",
        text: "Look at the whole journey: who starts the work, which information is needed, where it waits, and who can decide that it is complete."
      },
      {
        title: "An implementable roadmap",
        text: "Turn findings into sequenced changes with owners, dependencies, acceptance criteria, and a useful first release."
      }
    ]
  },
  challenge: {
    title: "Give each improvement an owner and a route into daily use.",
    before: [
      "Departments optimize separate tools while handoffs remain manual.",
      "A broad technology plan has no agreed first implementation.",
      "People expected to use a new process see it only at launch."
    ],
    after: [
      "Trace the workflow across roles, systems, and shared information.",
      "Prioritize a bounded change with an accountable decision-maker.",
      "Review the new process with its users before rolling it out."
    ]
  },
  offerings: {
    title: "Connect discovery, implementation, and adoption.",
    items: [
      {
        title: "Process discovery",
        text: "Map a real workflow, including delays, exceptions, duplicate entry, and the information needed at each handoff."
      },
      {
        title: "Systems & data review",
        text: "Identify the tools, records, owners, and integration constraints that influence how the process can improve."
      },
      {
        title: "Prioritized roadmap",
        text: "Compare opportunities by usefulness, effort, dependencies, and readiness, then define a practical first milestone."
      },
      {
        title: "Integration & automation",
        text: "Connect systems and repeated steps where supported interfaces and clear rules make the change feasible."
      },
      {
        title: "Focused custom tools",
        text: "Build an interface or application for a requirement that existing tools cannot satisfy cleanly."
      },
      {
        title: "Rollout & adoption support",
        text: "Document the new workflow, review it with users, and agree on training, ownership, and feedback after launch."
      }
    ]
  },
  deliverables: {
    title: "A clear picture of today and a working next step.",
    items: [
      {
        title: "Current-state map",
        text: "The selected workflow, people, systems, recurring friction, and unresolved questions captured in one reviewable view."
      },
      {
        title: "Prioritized delivery plan",
        text: "A sequence of proposed improvements with dependencies, owners, scope boundaries, and acceptance criteria for the first release."
      },
      {
        title: "Implemented milestone & handover",
        text: "For a delivery engagement, the agreed change, user walkthroughs, operating notes, and a way to review adoption after rollout."
      }
    ],
    acceptance: "We establish a baseline for the chosen workflow, such as completion time, repeated entry, exception volume, or handoff delays. Reviews consider both the working system and whether the intended users can carry out the new process."
  },
  spotlight: {
    title: "Improve one handoff from beginning to end.",
    text: "A sales-to-delivery handoff might need shared fields, a clear approval, and an automatically created task. Fixing that complete journey provides a useful result and reveals dependencies that a tool-by-tool review can miss.",
    points: [
      "A shared definition of the finished task",
      "Clear ownership at each transition",
      "A feedback loop with the people doing the work"
    ]
  },
  sectors: [
    "Service operations",
    "Commerce operations",
    "Customer management",
    "Reporting teams",
    "Logistics",
    "Growing product teams"
  ],
  tools: [
    "Workflow mapping",
    "APIs",
    "React",
    "Laravel",
    "SQL",
    "Automation"
  ],
  approach: {
    title: "Find the change that removes a recurring obstacle.",
    items: [
      {
        title: "Teams repeat the same data entry",
        text: "Identify the source of truth and connect the handoff, with validation and an owner for records that cannot be transferred."
      },
      {
        title: "Approvals live in messages",
        text: "Make requests, decisions, and status visible in a workflow people can follow and operational owners can review."
      },
      {
        title: "Several tools describe different realities",
        text: "Agree on shared records and definitions before deciding whether to integrate, configure, or replace a system."
      }
    ]
  },
  process: [
    "Walk through a real business process with the people involved. Record the goal, handoffs, systems, delays, and current measures.",
    "Identify root causes, dependencies, access constraints, and readiness for change. Separate process decisions from software requirements.",
    "Prioritize improvements and define the first release. Agree on responsibilities, baseline measures, acceptance criteria, and adoption needs.",
    "Implement the agreed change, test complete workflows, and review it with users. Prepare instructions and ownership before rollout.",
    "Review actual use and operational results. Adjust the roadmap using what the first release revealed rather than treating the original plan as fixed."
  ],
  engagement: {
    title: "Choose a starting point your team can support.",
    items: [
      {
        title: "Workflow & systems review",
        text: "Investigate one operating area and leave with a current-state map and prioritized recommendations."
      },
      {
        title: "A delivery milestone",
        text: "Implement a defined process improvement, integration, or tool with user acceptance and handover."
      },
      {
        title: "A phased improvement program",
        text: "Connect a series of agreed milestones through a roadmap reviewed against capacity, dependencies, and feedback."
      }
    ]
  },
  preparation: {
    title: "Bring a bottleneck and the people who understand it.",
    text: "A broad transformation brief becomes useful when it is grounded in an actual task. Pick a process that repeatedly causes delays or duplicate work and identify the people who can explain how it operates.",
    items: [
      "One workflow, its users, and the main problem to solve",
      "The tools and records involved, including manual workarounds",
      "A decision-maker, an operational owner, and any timing constraints"
    ]
  },
  faqTitle: "Questions about a digital transformation project.",
  faqs: [
    {
      title: "Where should we start?",
      text: "Choose a recurring problem that matters to the business and can be described through a real workflow. Discovery should establish who is affected, why the problem occurs, and what a useful first improvement would look like."
    },
    {
      title: "Do we have to replace our existing software?",
      text: "No. A configuration change, integration, or focused extension may be enough. The review compares those options with replacement using workflow fit, effort, ongoing ownership, and disruption."
    },
    {
      title: "What does the roadmap actually contain?",
      text: "It records proposed improvements, dependencies, decision owners, assumptions, and a delivery sequence. The first milestone has a defined scope and acceptance criteria so the roadmap can lead directly into implementation."
    },
    {
      title: "Can you implement the recommendations?",
      text: "I can implement agreed work that fits my development and integration capabilities. Discovery also identifies dependencies or specialist work that should be owned by your team or another provider before a delivery commitment is made."
    },
    {
      title: "How do you involve our team?",
      text: "The people doing the work contribute examples during discovery and review the proposed workflow. An operational owner approves decisions, while users test the tasks they will perform after rollout."
    },
    {
      title: "Can we work in phases?",
      text: "Yes. Each phase should improve a complete workflow and make its dependencies clear. The next milestone is reviewed against what has been learned, team capacity, and the business priorities at that point."
    },
    {
      title: "How is progress measured?",
      text: "We choose measures relevant to the problem before implementation, such as fewer repeated entries, shorter handoff delays, or clearer exception ownership. Adoption and user feedback are considered alongside the technical delivery."
    },
    {
      title: "What determines the scope and cost?",
      text: "The number of workflows, systems, decision-makers, integrations, and unresolved process questions affect the effort. A discovery engagement can clarify these first, followed by a separately agreed implementation milestone."
    }
  ],
  related: [
    "cloud-migration",
    "ai-automation",
    "custom-software-development"
  ],
  articles: [
    {
      title: "Turn an operational bottleneck into a delivery brief",
      text: "Describe the task, the handoffs, and the result before choosing a tool."
    },
    {
      title: "What makes a transformation roadmap usable?",
      text: "Give each improvement an owner, dependencies, acceptance criteria, and a realistic first step."
    },
    {
      title: "Include adoption in the implementation plan",
      text: "Plan user reviews, instructions, and operational ownership before rollout."
    }
  ]
};
