import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const erpImplementationContent: ServiceContent = {
  slug: "erp-implementation",
  category: "Business systems",
  title: "ERP Implementation Services",
  summary: "Connect inventory, orders, and operational records through a carefully scoped ERP rollout, with clear data ownership and workflow checks.",
  artwork: "systems",
  overview: {
    title: "Make shared operational data useful across the business.",
    text: "When purchasing, inventory, and order processing depend on separate records, teams spend time reconciling information before they can act. An ERP implementation brings those workflows into a connected operating system. I help with requirements, data preparation, integrations, and scoped technical delivery after assessing the selected platform and identifying any vendor-specific work that needs a specialist.",
    definitions: [
      {
        title: "Shared records and responsibilities",
        text: "Agree on what products, customers, suppliers, and transactions mean, which system owns them, and who is responsible for their accuracy."
      },
      {
        title: "A complete operational workflow",
        text: "Plan the rollout around tasks such as receiving stock or fulfilling an order, including approvals, exceptions, and the records each task changes."
      }
    ]
  },
  challenge: {
    title: "Agree on the process before configuring the system.",
    before: [
      "Different departments maintain conflicting versions of the same records.",
      "A broad rollout begins before workflows and approval rules are settled.",
      "Imports appear successful, but relationships and balances do not reconcile."
    ],
    after: [
      "Assign source ownership and agree on shared definitions.",
      "Choose a coherent first workflow with the people who operate it.",
      "Rehearse mappings and validate complete tasks using representative records."
    ]
  },
  offerings: {
    title: "Technical support across the ERP implementation journey.",
    items: [
      {
        title: "Operational requirements",
        text: "Map workflows, roles, approvals, exceptions, and reporting needs before translating them into system requirements."
      },
      {
        title: "Platform fit review",
        text: "Assess the proposed system's supported workflows, interfaces, licensing assumptions, and gaps against the agreed scope."
      },
      {
        title: "Data preparation & migration",
        text: "Define source fields, record mappings, cleanup responsibilities, import rehearsals, and reconciliation checks."
      },
      {
        title: "Operational integrations",
        text: "Connect supported interfaces to commerce, warehouse, customer, or reporting systems with clear ownership of each data flow."
      },
      {
        title: "Scoped extensions",
        text: "Build an interface or integration where supported configuration leaves a necessary gap and the maintenance cost is understood."
      },
      {
        title: "Rollout & handover",
        text: "Prepare workflow tests, operating instructions, cutover responsibilities, and a plan for handling issues after the first users go live."
      }
    ]
  },
  deliverables: {
    title: "A rollout your operational owners can validate.",
    items: [
      {
        title: "Workflow & fit document",
        text: "The agreed processes, roles, source records, platform gaps, and decisions needed before implementation."
      },
      {
        title: "Mappings & verified connections",
        text: "The scoped imports or integrations, with field definitions, exception handling, and reconciliation results from representative records."
      },
      {
        title: "Rollout & operating pack",
        text: "A cutover checklist, user acceptance scenarios, operating notes, and named owners for administration and support."
      }
    ],
    acceptance: "Business owners walk through the complete agreed tasks, including exceptions and approvals. Data is reconciled against approved source records, and specialist owners sign off any rules that depend on their domain expertise."
  },
  spotlight: {
    title: "Follow one order through every handoff.",
    text: "An order may affect stock, fulfilment, customer communication, and reporting. Walking that journey through the proposed system exposes missing fields, unclear ownership, and integration gaps before separate modules are treated as finished.",
    points: [
      "Consistent record identifiers and definitions",
      "Clear rules for updates and corrections",
      "User acceptance across departmental handoffs"
    ]
  },
  sectors: [
    "Inventory operations",
    "Retail & commerce",
    "Distribution",
    "Service businesses",
    "Manufacturing workflows",
    "Purchasing teams"
  ],
  tools: [
    "ERP APIs",
    "SQL",
    "Data migration",
    "Workflow mapping",
    "Access control",
    "Integration testing"
  ],
  approach: {
    title: "Start with a workflow the business can own.",
    items: [
      {
        title: "Stock records need reconciling",
        text: "Identify the source of truth and document receipts, adjustments, and transfers before connecting the records."
      },
      {
        title: "Orders cross disconnected tools",
        text: "Map the order and its status changes, then define the supported exchanges between the ERP and surrounding systems."
      },
      {
        title: "A rollout needs a narrower first stage",
        text: "Choose a complete process and user group, with a clear boundary between the new workflow and operations that remain unchanged."
      }
    ]
  },
  process: [
    "Map operational tasks with process owners. Identify shared records, approval rules, reporting needs, and the first workflow the rollout should support.",
    "Review the selected platform, data quality, integration interfaces, licensing assumptions, and gaps that require vendor or specialist input.",
    "Define mappings, permissions, configuration requirements, and acceptance scenarios. Plan the rollout sequence and responsibilities for data cleanup and sign-off.",
    "Implement the agreed technical scope, rehearse imports, and validate complete workflows with users. Resolve reconciliation issues before approving cutover.",
    "Hand over operating instructions and issue ownership. Review the first period of use before adding modules, customizations, or further integrations."
  ],
  engagement: {
    title: "A defined implementation boundary at each stage.",
    items: [
      {
        title: "Requirements & fit review",
        text: "Clarify the operating requirements, platform constraints, and technical work needed for a proposed rollout."
      },
      {
        title: "An integration milestone",
        text: "Connect a defined system or data flow, with mapping, exception handling, and acceptance checks."
      },
      {
        title: "A phased technical rollout",
        text: "Deliver agreed configuration, migration, or extension work alongside the process owners and any required platform specialists."
      }
    ]
  },
  preparation: {
    title: "Bring one operational workflow and the records behind it.",
    text: "The first discussion should establish whether you are selecting a platform or improving an existing implementation. Process owners and sample record structures help make the requirements concrete.",
    items: [
      "The selected ERP, or the business requirements guiding selection",
      "The first workflow, user roles, and source systems involved",
      "Sample data structures, decision owners, and rollout constraints"
    ]
  },
  faqTitle: "Questions before an ERP implementation.",
  faqs: [
    {
      title: "Which ERP platforms do you implement?",
      text: "Platform coverage is confirmed through a fit review rather than assumed. I assess the supported interfaces, configuration needs, and technical scope, then identify work that needs a vendor-certified implementer or another specialist."
    },
    {
      title: "Can we move from spreadsheets into an ERP?",
      text: "That can be scoped after reviewing the records, relationships, duplicate handling, and business definitions. Data cleanup has a named owner, and the migration is rehearsed and reconciled before the imported records are treated as operational."
    },
    {
      title: "Can we introduce the system in phases?",
      text: "Yes, where the dependencies allow a complete workflow to operate in each phase. We define how data moves between old and new processes during the transition so a partial rollout does not create competing records."
    },
    {
      title: "Can you integrate the ERP with our website or CRM?",
      text: "I review the platform's supported APIs, authentication, limits, and event capabilities first. The scope defines which records move, which system owns them, and what happens when an update fails or conflicts."
    },
    {
      title: "How much custom development will we need?",
      text: "We assess standard configuration and supported integrations before building extensions. Any customization should solve a necessary requirement and account for upgrades, administration, and the people who will maintain it."
    },
    {
      title: "Who validates financial or specialist business rules?",
      text: "Your designated domain owners define and approve those rules. I implement the agreed technical behavior and verification steps, while platform specialists participate where the system or module requires their expertise."
    },
    {
      title: "What drives implementation cost and timing?",
      text: "The number of workflows, data quality, integrations, customizations, user groups, and readiness of decision-makers all affect scope. A bounded first stage helps make estimates and acceptance criteria more dependable."
    },
    {
      title: "Who supports the system after launch?",
      text: "We agree on ownership of platform administration, integrations, user questions, and escalation before rollout. The handover covers the implemented scope; ongoing support and vendor services are arranged separately."
    }
  ],
  related: [
    "crm-implementation",
    "digital-transformation",
    "data-analytics"
  ],
  articles: [
    {
      title: "Map a complete workflow before selecting ERP modules",
      text: "Trace the records, approvals, and exceptions that connect departments."
    },
    {
      title: "A successful import still needs reconciliation",
      text: "Check record relationships and operational behavior before approving migrated data."
    },
    {
      title: "The maintenance cost of an ERP extension",
      text: "Consider upgrades, ownership, and support when standard configuration leaves a gap."
    }
  ]
};
