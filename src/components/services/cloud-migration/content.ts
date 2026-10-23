import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const cloudMigrationContent: ServiceContent = {
  slug: "cloud-migration",
  category: "Cloud, data & AI",
  title: "Cloud Migration Services",
  summary: "Move applications and data with a plan for dependencies, downtime, recovery, and the people who will run the new environment.",
  artwork: "cloud",
  overview: {
    title: "Move the workload with its dependencies understood.",
    text: "A migration involves more than copying an application to a new server. Databases, uploaded files, scheduled jobs, external connections, and deployment habits all need a destination. I help assess a defined workload, plan the move, and validate the important journeys before the new environment takes over. The scope includes how the application will be operated after the switch.",
    definitions: [
      {
        title: "A move with limited application changes",
        text: "Rehosting can suit a workload whose current behavior meets the need. Configuration, compatibility, deployment, and operational checks still require attention."
      },
      {
        title: "A move with targeted improvements",
        text: "Replatforming changes selected services or deployment patterns alongside the move. Each change should have a clear reason and its own validation requirements."
      }
    ]
  },
  challenge: {
    title: "Know what must work before you switch traffic.",
    before: [
      "Background jobs, file storage, or integrations are missing from the inventory.",
      "The cutover plan assumes data will stop changing at the right moment.",
      "Costs, alerts, and operational ownership are left until after the move."
    ],
    after: [
      "Trace dependencies across the whole application and its environments.",
      "Agree on write handling, final synchronization, and recovery conditions.",
      "Plan capacity, monitoring, access, and responsibilities before cutover."
    ]
  },
  offerings: {
    title: "Migration support from assessment to operational handover.",
    items: [
      {
        title: "Workload assessment",
        text: "Inventory the application, data stores, files, jobs, integrations, and current operating constraints."
      },
      {
        title: "Destination & cost planning",
        text: "Compare the requirements of the target environment, including capacity assumptions, access, backups, and expected running costs."
      },
      {
        title: "Application migration",
        text: "Prepare compatible application configuration, deployment steps, scheduled tasks, and external connections."
      },
      {
        title: "Data & file transfer",
        text: "Define mappings, transfer methods, rehearsal steps, integrity checks, and the handling of changes during the move."
      },
      {
        title: "Cutover preparation",
        text: "Create a sequenced runbook with owners, go/no-go checks, acceptable disruption, and a recovery plan."
      },
      {
        title: "Post-migration review",
        text: "Check the agreed journeys, monitoring, backup configuration, costs, and operational handover after the destination is live."
      }
    ]
  },
  deliverables: {
    title: "A migration runbook with a verifiable destination.",
    items: [
      {
        title: "Inventory & migration plan",
        text: "A dependency map, destination assumptions, scoped workloads, and a sequence that accounts for integrations and data movement."
      },
      {
        title: "Rehearsal & validation record",
        text: "Results from agreed transfer and application checks, with outstanding risks and the criteria for proceeding to cutover."
      },
      {
        title: "Operating handover",
        text: "Environment and deployment notes, access ownership, backup and recovery procedures, and the checks needed during the initial live period."
      }
    ],
    acceptance: "We verify the agreed user journeys, transferred records and files, background tasks, and external integrations. The handover also checks that the designated operator can deploy, inspect failures, and follow the recovery instructions."
  },
  spotlight: {
    title: "Rehearse the move while there is time to adjust.",
    text: "A rehearsal can reveal missing permissions, transfer limits, configuration differences, or slow validation steps. Those findings become changes to the runbook, so the live cutover follows a process that has already been exercised where practical.",
    points: [
      "Representative application and data checks",
      "Named owners for each cutover step",
      "Clear stop conditions and recovery limits"
    ]
  },
  sectors: [
    "SaaS applications",
    "Commerce platforms",
    "Internal systems",
    "Content & media",
    "Data services",
    "Customer portals"
  ],
  tools: [
    "Linux",
    "Containers",
    "Managed databases",
    "Object storage",
    "CI/CD",
    "Monitoring"
  ],
  approach: {
    title: "Match the migration to the reason for moving.",
    items: [
      {
        title: "The hosting environment is limiting releases",
        text: "Review deployment, access, and environment requirements before choosing which parts of the operating model to change."
      },
      {
        title: "An application needs a new home",
        text: "Plan a focused move around compatibility and continuity, keeping unrelated product changes outside the cutover."
      },
      {
        title: "Migration and modernization overlap",
        text: "Separate the stages where possible so application behavior and infrastructure changes can be checked independently."
      }
    ]
  },
  process: [
    "Inventory the workload and discuss why it needs to move. Identify critical journeys, data owners, existing backups, and acceptable service disruption.",
    "Review destination compatibility, external dependencies, access, and cost assumptions. Identify any specialist infrastructure requirements early.",
    "Design the transfer, deployment, and cutover sequence. Agree on data validation, write handling, go/no-go criteria, and recovery responsibilities.",
    "Prepare the environment, rehearse the agreed steps, and execute the approved cutover. Record validation results and resolve exceptions before closing the move.",
    "Review live operation and complete the handover. Retire old resources only after retention, recovery, and remaining dependencies have been checked."
  ],
  engagement: {
    title: "Scope the move around a defined workload.",
    items: [
      {
        title: "Migration readiness review",
        text: "An inventory, compatibility assessment, and proposed sequence before committing to execution."
      },
      {
        title: "Application migration",
        text: "A specified application and environment, with preparation, cutover, validation, and handover."
      },
      {
        title: "A phased transition",
        text: "Multiple bounded migration stages when application changes or shared dependencies require a longer sequence."
      }
    ]
  },
  preparation: {
    title: "Bring the workload and the reason it needs to move.",
    text: "An initial discussion should establish what is running, what is difficult today, and how much interruption the business can tolerate. A useful assessment can then be scoped around the unknowns.",
    items: [
      "Application stack, hosting, data stores, and approximate data volumes",
      "External integrations, scheduled jobs, and current backup arrangements",
      "Target environment, deadline, and acceptable disruption"
    ]
  },
  faqTitle: "Questions before a cloud migration.",
  faqs: [
    {
      title: "Can the application move without downtime?",
      text: "The achievable cutover window depends on the architecture, data store, and synchronization options. We establish a realistic target during planning and test the steps that affect it. Zero downtime is not assumed as part of every migration."
    },
    {
      title: "Will moving to the cloud lower our costs?",
      text: "It may or may not. We compare the current setup with destination costs such as compute, storage, transfer, backups, and monitoring. Expected usage and ongoing operating effort matter as much as the advertised price of a server."
    },
    {
      title: "Do we need to rewrite the application?",
      text: "Some workloads can move with configuration and deployment changes; others need application changes. The assessment separates migration requirements from optional modernization so the cutover does not take on unnecessary complexity."
    },
    {
      title: "Which provider will you use?",
      text: "We review your existing accounts, team skills, regional requirements, integrations, and workload needs. Implementation scope is confirmed for the chosen environment, including any work that needs a dedicated infrastructure specialist."
    },
    {
      title: "How do you check the transferred data?",
      text: "Checks are agreed for each data type. They may include counts, checksums, relationship checks, sample records, and application workflows. We also plan how to reconcile data written during the transition."
    },
    {
      title: "What happens if the cutover fails?",
      text: "The runbook includes stop conditions, recovery owners, and a fallback path. If new writes have reached the destination, recovery must account for those changes. A code rollback alone is not treated as a complete data recovery plan."
    },
    {
      title: "Who runs the environment after migration?",
      text: "We name the operational owner before cutover and hand over the agreed deployment, monitoring, backup, and escalation procedures. Ongoing managed operations or on-call coverage require a separate arrangement."
    },
    {
      title: "What determines the migration schedule?",
      text: "Dependencies, data volume, transfer limits, destination readiness, and rehearsal findings all affect timing. A fixed business deadline should be discussed early so the sequence and cutover window can be planned around it."
    }
  ],
  related: [
    "legacy-modernization",
    "custom-software-development",
    "data-analytics"
  ],
  articles: [
    {
      title: "Inventory the dependencies before choosing a migration date",
      text: "Find the jobs, files, permissions, and provider connections that keep an application working."
    },
    {
      title: "What a cutover rehearsal should prove",
      text: "Test the sequence, data checks, and recovery decisions before switching the live workload."
    },
    {
      title: "The handover after a cloud move",
      text: "Make ownership of deployment, backups, alerts, and costs explicit."
    }
  ]
};
