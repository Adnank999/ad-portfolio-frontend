import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const legacyModernizationContent: ServiceContent = {
  slug: "legacy-modernization",
  category: "Software & product",
  title: "Legacy System Modernization",
  summary: "Make an existing application easier to change and support through focused upgrades, stronger tests, and a staged modernization plan.",
  artwork: "software",
  overview: {
    title: "Keep valuable business behavior. Improve what gets in the way.",
    text: "An older application often contains years of business knowledge as well as technical debt. I help identify which parts make releases risky, support difficult, or new features expensive. The result is a practical modernization plan: preserve behavior people rely on, improve the most limiting components, and replace capabilities in stages when replacement is justified.",
    definitions: [
      {
        title: "Improve an existing capability",
        text: "Dependency updates, targeted refactoring, query improvements, or a clearer interface can address a specific problem without replacing the whole application."
      },
      {
        title: "Replace a bounded part",
        text: "When a component has reached its limits, a stable boundary lets a new implementation take over a defined responsibility while the rest of the system continues to operate."
      }
    ]
  },
  challenge: {
    title: "Make the next change safer to deliver.",
    before: [
      "A small change can break a workflow nobody documented.",
      "Deployments depend on manual steps and one person's knowledge.",
      "A replacement project grows while the old system still needs support."
    ],
    after: [
      "Capture the critical journeys and unusual cases before changing behavior.",
      "Document environments and add repeatable verification around releases.",
      "Give each modernization stage a boundary, acceptance check, and retirement plan."
    ]
  },
  offerings: {
    title: "Modernization focused on the constraint you need to remove.",
    items: [
      {
        title: "Application assessment",
        text: "Review architecture, dependencies, data flows, deployment, and recurring incidents to identify a prioritized set of changes."
      },
      {
        title: "Framework & dependency upgrades",
        text: "Map compatibility requirements, breaking changes, and validation steps for an agreed upgrade path."
      },
      {
        title: "Regression protection",
        text: "Add tests and representative fixtures around business behavior that must survive the modernization."
      },
      {
        title: "API & integration boundaries",
        text: "Create stable interfaces between older components, new functionality, and external systems."
      },
      {
        title: "Interface & workflow renewal",
        text: "Improve difficult screens and repeated tasks while keeping validated business rules and permissions intact."
      },
      {
        title: "Incremental replacement",
        text: "Move a capability into a new implementation with a controlled transition, data checks, and a plan to remove the old path."
      }
    ]
  },
  deliverables: {
    title: "A modernization plan you can execute in stages.",
    items: [
      {
        title: "Risk & dependency map",
        text: "An inventory of the relevant components, unsupported dependencies, critical workflows, and areas where knowledge is missing."
      },
      {
        title: "A verified improvement",
        text: "The agreed upgrade or replacement, with regression checks, compatibility notes, and explicit release conditions."
      },
      {
        title: "Transition & maintenance notes",
        text: "Deployment steps, fallback limits, data reconciliation checks, and the work needed to retire superseded components."
      }
    ],
    acceptance: "We compare critical workflows before and after the change, inspect the agreed performance or maintenance issue, and verify release and recovery procedures. Any behavior change is reviewed explicitly with the people who own it."
  },
  spotlight: {
    title: "Let old and new components meet at a clear boundary.",
    text: "A booking flow, reporting module, or provider integration can often be understood independently of the whole system. Establishing that boundary makes it possible to validate one change at a time and keep the transition visible.",
    points: [
      "Document inputs, outputs, and important side effects",
      "Check data consistency across both implementations",
      "Define when the old path can be retired"
    ]
  },
  sectors: [
    "Business applications",
    "Commerce platforms",
    "Customer portals",
    "Supplier integrations",
    "Internal tools",
    "Operational reporting"
  ],
  tools: [
    "PHP",
    "Laravel",
    "React",
    "SQL",
    "API contracts",
    "Regression tests"
  ],
  approach: {
    title: "Choose a response that matches the problem.",
    items: [
      {
        title: "Releases have become fragile",
        text: "Start with environment documentation, critical-path tests, and smaller release steps so routine changes are easier to verify."
      },
      {
        title: "A dependency blocks progress",
        text: "Isolate the compatibility work, review supported upgrade steps, and test the behavior affected by the change."
      },
      {
        title: "One module limits the product",
        text: "Define a replacement boundary and transition plan for that capability while preserving the remaining application."
      }
    ]
  },
  process: [
    "Walk through the application with users and maintainers. Record the business-critical tasks, recurring problems, deployment process, and reasons for modernizing.",
    "Review the relevant code and dependencies. Identify undocumented behavior, test gaps, data risks, and the changes most likely to unblock useful work.",
    "Choose a bounded first stage. Define compatibility requirements, regression checks, data handling, and the conditions for release or fallback.",
    "Implement the change in reviewable steps and compare behavior against representative cases. Coordinate the release with ongoing product development.",
    "Complete the handover, remove obsolete paths when safe, and use the findings to update the remaining modernization priorities."
  ],
  engagement: {
    title: "Start with the part of the system that needs attention.",
    items: [
      {
        title: "Modernization assessment",
        text: "A review of a defined application or module, with risks, options, and recommended sequencing."
      },
      {
        title: "A targeted upgrade",
        text: "An agreed dependency, interface, performance issue, or integration boundary improved and verified."
      },
      {
        title: "A staged replacement",
        text: "A series of bounded releases with explicit ownership of old and new components during the transition."
      }
    ]
  },
  preparation: {
    title: "Bring the recurring problem and the workflow it affects.",
    text: "Useful starting material includes an example of a difficult release or a task users regularly struggle with. Existing documentation helps, but missing documentation can itself be part of the assessment.",
    items: [
      "The application stack, versions, and hosting arrangement",
      "The workflows that must keep working and any known failure cases",
      "Your release constraints, maintainers, and priorities for the next change"
    ]
  },
  faqTitle: "Legacy modernization questions, answered.",
  faqs: [
    {
      title: "Do we need to rewrite the whole application?",
      text: "That decision follows the assessment. Targeted upgrades, refactoring, or replacing a module may resolve the main constraint. A full rewrite needs a clear benefit, a realistic transition plan, and a way to preserve business behavior throughout the move."
    },
    {
      title: "Can feature development continue during modernization?",
      text: "It can, if responsibilities and dependencies are planned together. We agree on which parts are changing, how releases are coordinated, and how compatibility is checked so product work does not invalidate the modernization effort."
    },
    {
      title: "What if there are no tests or useful documentation?",
      text: "I begin with walkthroughs, representative data, and a bounded set of checks around critical behavior. The initial work may focus on understanding the system and establishing a safety net before making structural changes."
    },
    {
      title: "Can you work with older PHP or Laravel applications?",
      text: "I can assess them after reviewing the versions, dependencies, codebase, and hosting. The review establishes viable upgrade paths and any constraints that need additional specialist support before committing to the implementation."
    },
    {
      title: "How do you protect existing data?",
      text: "We plan backups, migration rehearsals, mapping rules, and reconciliation checks for the affected data. Changes that alter stored information need a recovery strategy that accounts for new writes, not only a code rollback."
    },
    {
      title: "Will users need to change how they work?",
      text: "Only where the agreed scope changes their workflow. I involve users in reviewing those changes and document the new process. Training and the switch from old to new behavior are considered before rollout."
    },
    {
      title: "How do we choose the first modernization step?",
      text: "Prioritize a bounded change that addresses business risk or repeatedly blocks useful work. Dependencies, release constraints, and the ability to verify the result all influence the order."
    },
    {
      title: "How are cost and timing estimated for an unfamiliar system?",
      text: "An assessment helps uncover the parts that are difficult to estimate from a brief alone. I then propose a first milestone with explicit assumptions and review points. Further stages are updated as the system becomes better understood."
    }
  ],
  related: [
    "cloud-migration",
    "custom-software-development",
    "digital-transformation"
  ],
  articles: [
    {
      title: "Choose the first modernization boundary",
      text: "Identify a component that can be improved and verified without making the whole application a moving target."
    },
    {
      title: "Capture the behavior your users depend on",
      text: "Use representative cases and regression checks to preserve the knowledge hidden in a long-running system."
    },
    {
      title: "Plan retirement as well as replacement",
      text: "Decide when old code, integrations, and operational steps can actually be removed."
    }
  ]
};
