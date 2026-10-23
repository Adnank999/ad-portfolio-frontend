import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const dataAnalyticsContent: ServiceContent = {
  slug: "data-analytics",
  category: "Cloud, data & AI",
  title: "Data Analytics Consulting",
  summary: "Connect scattered data, agree on the numbers that matter, and build reporting that helps your team decide what to do next.",
  artwork: "data",
  overview: {
    title: "Build reporting around a decision your team needs to make.",
    text: "When teams rely on repeated exports or disagree about the same number, another dashboard will not resolve the underlying problem by itself. I connect source data, define calculations with the people who own them, and build reporting around specific questions. The work makes freshness, exclusions, and data quality visible so the person reading a report understands what it can support.",
    definitions: [
      {
        title: "Data foundations",
        text: "Bring records together through repeatable imports and transformations, with clear ownership and checks for missing, duplicate, or stale information."
      },
      {
        title: "Reporting people can use",
        text: "Present the relevant measures, trends, and exceptions in a dashboard designed for a particular role and decision."
      }
    ]
  },
  challenge: {
    title: "Give the same number the same meaning.",
    before: [
      "Teams calculate revenue, bookings, or active users differently.",
      "A manual export and spreadsheet formula are the only reporting process.",
      "Charts look current even when the source refresh has failed."
    ],
    after: [
      "Document the calculation, time period, exclusions, and owner of each metric.",
      "Build repeatable data flows with reconciliation and failure reporting.",
      "Show update times, missing information, and limitations beside the result."
    ]
  },
  offerings: {
    title: "From source records to useful operational reporting.",
    items: [
      {
        title: "Analytics discovery",
        text: "Map the decisions, users, sources, existing reports, and access needed for the first reporting milestone."
      },
      {
        title: "Data pipelines",
        text: "Create scheduled imports and transformations with clear handling for missing records, retries, and source changes."
      },
      {
        title: "Metric definitions",
        text: "Document business calculations, filters, time zones, and exclusions so teams can review the meaning before implementation."
      },
      {
        title: "Operational dashboards",
        text: "Build focused views for trends, exceptions, and drill-downs, with access appropriate to each user role."
      },
      {
        title: "Quality & reconciliation checks",
        text: "Compare outputs with source records and make stale, invalid, or incomplete data visible."
      },
      {
        title: "Analytics in your application",
        text: "Add reporting to an existing product or workspace so users can act without moving between disconnected tools."
      }
    ]
  },
  deliverables: {
    title: "Reporting with a traceable path back to the source.",
    items: [
      {
        title: "Source & metric reference",
        text: "A source inventory and definitions for the agreed metrics, including owners, refresh expectations, and known gaps."
      },
      {
        title: "Pipeline & dashboard",
        text: "The scoped data flows and reporting views, with representative reconciliation checks and user access rules."
      },
      {
        title: "Reporting handover",
        text: "Refresh and failure-handling instructions, calculation notes, and guidance for interpreting the data and its limitations."
      }
    ],
    acceptance: "We reconcile sample outputs with agreed source records, review calculations with business owners, and check refresh failures and access restrictions. Users should be able to answer the questions that defined the reporting scope."
  },
  spotlight: {
    title: "Make the next action visible.",
    text: "A booking report might help operations investigate failed confirmations. A support view might reveal unresolved requests by age. Choosing the action first makes it easier to decide which data, filters, and level of detail belong in the interface.",
    points: [
      "One audience and purpose for each view",
      "A visible update time and clear definitions",
      "Enough detail to investigate an exception"
    ]
  },
  sectors: [
    "SaaS operations",
    "Commerce reporting",
    "Travel & booking",
    "Customer support",
    "Sales operations",
    "Internal reporting"
  ],
  tools: [
    "SQL",
    "REST APIs",
    "TypeScript",
    "React",
    "Scheduled jobs",
    "Data validation"
  ],
  approach: {
    title: "Useful analytics starts with a recurring question.",
    items: [
      {
        title: "Operations needs an exception queue",
        text: "Bring together the records that require attention, with status, age, ownership, and a route back to the original task."
      },
      {
        title: "Sales and delivery disagree on performance",
        text: "Align definitions and source ownership before presenting a shared view of pipeline, completed work, or customer activity."
      },
      {
        title: "A product needs usage reporting",
        text: "Define meaningful events and user groups, then build a view that supports a specific product decision."
      }
    ]
  },
  process: [
    "Identify the report's users and the decisions it should support. Collect existing definitions, sample reports, sources, and access requirements.",
    "Inspect representative records for missing fields, duplicates, inconsistent values, and refresh limitations. Agree on which gaps must be resolved first.",
    "Define the metrics and transformations with business owners. Design the dashboard, access rules, reconciliation checks, and refresh schedule.",
    "Build the data flow and reporting views. Compare results with representative source records and review the answers with the intended users.",
    "Hand over calculations and operational procedures. Review usage and recurring data issues before adding more metrics or reports."
  ],
  engagement: {
    title: "Start with one reporting problem worth solving.",
    items: [
      {
        title: "Data & reporting review",
        text: "A source map, definition gaps, and recommended priorities for a reliable first reporting release."
      },
      {
        title: "A focused dashboard",
        text: "A defined set of questions, metrics, and sources delivered as a usable reporting workspace."
      },
      {
        title: "Data foundation improvements",
        text: "Work on ingestion, reconciliation, or metric consistency before expanding the reporting interface."
      }
    ]
  },
  preparation: {
    title: "Bring a question and the report you currently use.",
    text: "A sample export, screenshot, or anonymized set of records helps explain the current process. The most useful brief states who needs the answer and what they will do differently once they have it.",
    items: [
      "The recurring decision and the person responsible for it",
      "Existing reports, source systems, and sample data formats",
      "Metric definitions, refresh needs, and access restrictions"
    ]
  },
  faqTitle: "Data analytics questions, answered.",
  faqs: [
    {
      title: "Can you work with the systems and data we already have?",
      text: "Yes, after reviewing access, formats, source ownership, and quality. The first milestone can use existing databases, exports, or APIs where they are suitable. Replacing every source system is not a prerequisite."
    },
    {
      title: "Do we need a data warehouse?",
      text: "That depends on the number of sources, data volume, transformations, access patterns, and refresh needs. We choose an architecture for the actual reporting requirements rather than adding a warehouse by default."
    },
    {
      title: "Can the reports update automatically?",
      text: "Where sources provide reliable access, scheduled ingestion and refreshes can be included. The design defines update frequency, failure alerts, retry behavior, and how users know when the latest refresh did not succeed."
    },
    {
      title: "What if our data is incomplete or inconsistent?",
      text: "The assessment records the issues and separates what can be corrected in a pipeline from what requires a source-system decision. Missing data and exclusions stay visible; the dashboard does not silently manufacture a complete picture."
    },
    {
      title: "Who decides how a business metric is calculated?",
      text: "Your business owner approves the definition. I help document the calculation, filters, time period, and exclusions, then implement it consistently. If two teams need different measures, we label that distinction clearly."
    },
    {
      title: "Can AI answer questions about our data?",
      text: "A bounded interface can be explored after the underlying data and permissions are understood. It needs validated queries, restricted access, and a way to inspect the records behind an answer. It should not replace agreed metric definitions."
    },
    {
      title: "How is access to sensitive data handled?",
      text: "We define who can view which records and fields before building the reporting layer. The scope can include restricted views, data minimization, and masked development samples. Provider access and retention requirements are reviewed with you."
    },
    {
      title: "How do you estimate the work?",
      text: "Source access, data quality, metric complexity, refresh frequency, and the number of reporting views drive the scope. Starting with one question and a representative dataset helps establish a realistic first milestone."
    }
  ],
  related: [
    "ai-automation",
    "cloud-migration",
    "custom-software-development"
  ],
  projectSlugs: [
    "saas-command-center"
  ],
  articles: [
    {
      title: "Write the metric definition before the dashboard",
      text: "Agree on calculations, exclusions, and ownership so the same number means the same thing."
    },
    {
      title: "Show when a report cannot answer the question",
      text: "Make freshness, incomplete records, and source limitations visible to the people using the data."
    },
    {
      title: "From an operational question to a reporting view",
      text: "Choose the audience, action, and level of detail before choosing charts."
    }
  ]
};
