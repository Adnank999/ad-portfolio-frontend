import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const crmImplementationContent: ServiceContent = {
  slug: "crm-implementation",
  category: "Business systems",
  title: "CRM Implementation Services",
  summary: "Give your team a clear pipeline, useful customer records, and connected follow-ups through a CRM implementation shaped around daily work.",
  artwork: "systems",
  overview: {
    title: "Make the next customer action easy to see.",
    text: "A CRM becomes useful when a person can open it and understand who owns a relationship, what has happened, and what needs to happen next. I help translate your sales and customer workflows into fields, stages, permissions, and integrations. The scope can cover a new rollout or improvements to a CRM that already holds data but is difficult for the team to use.",
    definitions: [
      {
        title: "A shared customer process",
        text: "Define how enquiries arrive, when a lead changes stage, who owns the next action, and what information must be available at each handoff."
      },
      {
        title: "An everyday working tool",
        text: "Give each role useful views and purposeful fields so the CRM supports their tasks without requiring a second record in a spreadsheet."
      }
    ]
  },
  challenge: {
    title: "Make customer information easier to trust and act on.",
    before: [
      "Sales stages have different meanings for different people.",
      "Duplicates and missing fields make customer history difficult to follow.",
      "Website enquiries arrive without an owner or a reliable next step."
    ],
    after: [
      "Use shared stage definitions and explicit entry and exit conditions.",
      "Plan field mapping, duplicate rules, and record ownership before import.",
      "Connect intake, assignment, reminders, and confirmation as one workflow."
    ]
  },
  offerings: {
    title: "CRM implementation from pipeline design to daily use.",
    items: [
      {
        title: "Workflow & platform review",
        text: "Map lead sources, sales stages, customer handoffs, user roles, and the requirements a platform needs to support."
      },
      {
        title: "Pipeline & field design",
        text: "Define stages, required information, relationships, permissions, and views that reflect the real process."
      },
      {
        title: "Customer data migration",
        text: "Prepare mappings, duplicate handling, source ownership, and test imports that preserve useful relationships and history."
      },
      {
        title: "Website & application integrations",
        text: "Connect forms and supported systems with validated fields, assignment rules, and handling for failed deliveries."
      },
      {
        title: "Reminders & routing",
        text: "Set up agreed rules for ownership, tasks, and follow-up, with clear conditions and a way to handle exceptions."
      },
      {
        title: "User adoption & handover",
        text: "Review common tasks with users, document the operating process, and agree on administration and support after rollout."
      }
    ]
  },
  deliverables: {
    title: "A CRM your team can use with a shared understanding.",
    items: [
      {
        title: "Pipeline & data reference",
        text: "Stage definitions, field meanings, ownership rules, and mappings for records included in the rollout."
      },
      {
        title: "Configured workflow & integrations",
        text: "The agreed pipeline, views, permissions, and connections, verified through representative customer journeys."
      },
      {
        title: "Migration & adoption handover",
        text: "Import reconciliation, instructions for frequent tasks, and clear ownership of data quality, system administration, and follow-up issues."
      }
    ],
    acceptance: "We trace an enquiry from capture to assignment and the next agreed sales stage. Users check everyday tasks, imported records are reconciled, and integration failures are visible to the person responsible for resolving them."
  },
  spotlight: {
    title: "Connect the first enquiry to a responsible person.",
    text: "A website form, imported lead, and referral should each arrive with enough context to be useful. Planning the route into the CRM helps prevent duplicate records, missing source information, and enquiries that nobody realizes they own.",
    points: [
      "Consistent capture and duplicate rules",
      "A clear assignment and next action",
      "Visibility when a form or integration fails"
    ]
  },
  sectors: [
    "Professional services",
    "B2B sales",
    "Commerce",
    "Customer support",
    "Property services",
    "SaaS businesses"
  ],
  tools: [
    "CRM APIs",
    "Webhooks",
    "Data mapping",
    "Forms",
    "Reporting",
    "Workflow rules"
  ],
  approach: {
    title: "Improve the part of the customer journey that needs attention.",
    items: [
      {
        title: "Enquiries are spread across inboxes",
        text: "Bring them into a shared pipeline with source context, an owner, and a clear follow-up task."
      },
      {
        title: "An installed CRM is underused",
        text: "Review the required fields, views, and daily tasks with users to find what makes the system difficult to keep current."
      },
      {
        title: "Sales and delivery lose context",
        text: "Define the handoff and transfer the information the next team needs when an opportunity reaches the agreed stage."
      }
    ]
  },
  process: [
    "Walk through lead capture, qualification, sales stages, and customer handoffs. Identify the people using the CRM and the decisions they need it to support.",
    "Review the current platform, source data, licensing constraints, integration access, and reasons users leave the system to finish their work.",
    "Agree on stage definitions, fields, permissions, record ownership, and import rules. Design the first rollout and its acceptance scenarios.",
    "Configure and connect the scoped workflow. Rehearse imports and test representative journeys with users, including duplicates and failed submissions.",
    "Complete the handover and review early adoption. Use actual questions and data-quality issues to prioritize the next improvements."
  ],
  engagement: {
    title: "A new pipeline, a better connection, or a more usable CRM.",
    items: [
      {
        title: "A focused implementation",
        text: "One defined pipeline or team, with agreed fields, migration needs, and user acceptance."
      },
      {
        title: "An integration project",
        text: "Connect a website, application, or operational system to an existing CRM with clear data ownership."
      },
      {
        title: "An adoption improvement",
        text: "Refine a live CRM's workflows, views, or data quality based on the tasks users struggle to complete."
      }
    ]
  },
  preparation: {
    title: "Bring a lead journey and the places customer data lives.",
    text: "A few sample stages and a walkthrough of a recent enquiry help establish the real process. If you already use a CRM, the tasks people avoid are useful clues to what needs to change.",
    items: [
      "Your CRM platform or the requirements for a new one",
      "Lead sources, sales stages, user roles, and existing data formats",
      "The handoffs, reports, and integrations the team needs most"
    ]
  },
  faqTitle: "CRM implementation questions, answered.",
  faqs: [
    {
      title: "Which CRM should we choose?",
      text: "We compare your workflows, user roles, current tools, integration requirements, and ongoing costs. I confirm the technical scope against the selected platform before committing to implementation. The decision should include the people who will administer and use it."
    },
    {
      title: "Can you improve a CRM we already use?",
      text: "Yes. Discovery can focus on a specific problem such as low adoption, inconsistent stages, duplicate records, or missing integrations. A focused improvement may be enough without moving to a different platform."
    },
    {
      title: "Can we import existing contacts and sales history?",
      text: "I review the available formats, relationships, required fields, and destination limits first. We agree on duplicate handling, test a representative import, and reconcile the result before moving the full agreed dataset."
    },
    {
      title: "Can the CRM connect to our website?",
      text: "Where supported, forms and applications can send validated information through an API or webhook. The scope covers field mapping, ownership, confirmation, and failed delivery so submitting a form does not silently lose an enquiry."
    },
    {
      title: "Can follow-ups be automated?",
      text: "Reminders, assignments, and supported actions can follow agreed rules. Outbound messaging needs explicit decisions about permissions, opt-outs, content approval, and ownership before it is enabled."
    },
    {
      title: "How do you help the team adopt the CRM?",
      text: "I involve users in the workflow review, keep required fields purposeful, and test common tasks with them. The handover documents those tasks and gives administration and data quality a named owner."
    },
    {
      title: "What affects the price and timeline?",
      text: "The number of pipelines, user roles, imports, integrations, and custom requirements drives the work. Platform subscriptions and third-party charges are separate from implementation unless the written scope says otherwise."
    },
    {
      title: "Who keeps the CRM and integrations working after launch?",
      text: "Before rollout, we agree on platform administration, integration monitoring, data cleanup, and escalation. Ongoing support or improvements can be scoped separately around those responsibilities."
    }
  ],
  related: [
    "erp-implementation",
    "data-analytics",
    "ai-automation"
  ],
  articles: [
    {
      title: "Define sales stages people can apply consistently",
      text: "Give each stage a clear meaning, owner, and condition for moving forward."
    },
    {
      title: "Plan the enquiry journey into your CRM",
      text: "Connect field mapping, assignment, duplicate handling, and failed-delivery checks."
    },
    {
      title: "Find out why a team avoids its CRM",
      text: "Review daily tasks and unnecessary data entry before adding more automation."
    }
  ]
};
