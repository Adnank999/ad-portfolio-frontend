import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const aiAutomationContent: ServiceContent = {
  slug: "ai-automation",
  category: "Cloud, data & AI",
  title: "AI Automation Services",
  summary: "Reduce repetitive document and workflow tasks with connected systems, reviewable AI output, and clear control over what happens next.",
  artwork: "automation",
  overview: {
    title: "Put automation around a task your team already understands.",
    text: "Sorting incoming requests, extracting information from documents, and moving records between tools can consume time every day. I help map that work, separate predictable steps from tasks that need interpretation, and build a bounded workflow around it. AI can assist with language-heavy work while validation, permissions, and human review determine what the system is allowed to do with the result.",
    definitions: [
      {
        title: "Rules for predictable work",
        text: "Use explicit logic for required fields, calculations, routing, and known system updates. Those steps should have clear inputs and expected outcomes."
      },
      {
        title: "AI for interpretation",
        text: "Use a model to assist with extraction, classification, summaries, or drafts, then check the output before it drives the next action."
      }
    ]
  },
  challenge: {
    title: "Reduce the manual work without hiding the exceptions.",
    before: [
      "People repeatedly copy information between inboxes, documents, and business tools.",
      "A convincing AI answer is accepted without checking its source or structure.",
      "Failed jobs disappear into a log nobody owns."
    ],
    after: [
      "Connect the repeated steps and keep a record of what moved through them.",
      "Validate output and route uncertain or consequential cases for review.",
      "Make failures visible, recoverable, and assigned to an operational owner."
    ]
  },
  offerings: {
    title: "Practical automation for repeatable business tasks.",
    items: [
      {
        title: "Workflow discovery",
        text: "Observe the current process, its volume, exceptions, and review effort to identify a worthwhile first use case."
      },
      {
        title: "Document intake",
        text: "Extract agreed fields from supported documents and present the results alongside the source for verification."
      },
      {
        title: "Request classification",
        text: "Suggest categories, priorities, or destinations for incoming work, with an exception path for ambiguous inputs."
      },
      {
        title: "Drafts & summaries",
        text: "Prepare a first draft or concise summary for an authorized person to review before publication or sending."
      },
      {
        title: "System connections",
        text: "Move validated records through APIs, webhooks, and background jobs with bounded permissions and failure handling."
      },
      {
        title: "Review & monitoring tools",
        text: "Provide queues, logs, retry controls, and visibility into processing volume, errors, review effort, and running costs."
      }
    ]
  },
  deliverables: {
    title: "A workflow with a clear boundary and a way to inspect it.",
    items: [
      {
        title: "Workflow & permissions map",
        text: "The inputs, steps, systems, allowed actions, review points, and conditions that stop the workflow."
      },
      {
        title: "Pilot & evaluation cases",
        text: "A working implementation tested against representative inputs, including difficult examples and expected failure behavior."
      },
      {
        title: "Operational controls",
        text: "Review and exception handling, monitoring instructions, cost assumptions, and a documented way to pause or adjust the workflow."
      }
    ],
    acceptance: "We compare the pilot with an agreed manual baseline: task completion, output errors, review time, failures, and running costs. A useful result accounts for the effort needed to check and operate the automation."
  },
  spotlight: {
    title: "Start with one intake-to-review workflow.",
    text: "For example, an incoming document can be checked, processed into suggested fields, and placed in a review queue. Only approved data moves into the destination system. That gives you a complete process to evaluate before extending what the automation can do.",
    points: [
      "Source material remains available for review",
      "Validation happens before a system update",
      "Exceptions have a clear owner and next step"
    ]
  },
  sectors: [
    "Customer operations",
    "Document-heavy teams",
    "Commerce workflows",
    "Content operations",
    "Internal support",
    "Data processing"
  ],
  tools: [
    "REST APIs",
    "Webhooks",
    "Laravel queues",
    "TypeScript",
    "Redis",
    "Model APIs"
  ],
  approach: {
    title: "Choose a first task with a visible result.",
    items: [
      {
        title: "Documents need repeated data entry",
        text: "Extract a defined set of fields, highlight missing information, and let a reviewer approve the record before it enters the business system."
      },
      {
        title: "Requests need sorting",
        text: "Help a team categorize incoming work and suggest a destination, while keeping unusual requests in a review queue."
      },
      {
        title: "Information needs summarizing",
        text: "Prepare a concise draft from approved source material so a person can verify the details and decide what to share."
      }
    ]
  },
  process: [
    "Walk through the current task, including its volume, exceptions, sensitive fields, and manual review time. Identify who owns the outcome.",
    "Assess integration access and sample inputs. Decide which steps need explicit rules and whether AI adds enough value to justify its cost and review effort.",
    "Define output formats, permissions, validation, approval points, and fallback behavior. Agree on representative evaluation cases and a useful pilot result.",
    "Build the bounded workflow and test normal, ambiguous, and failed cases. Review the results with the people who will operate it before enabling live actions.",
    "Hand over the controls and review pilot evidence. Extend the scope only after checking errors, operating effort, user feedback, and ongoing costs."
  ],
  engagement: {
    title: "A practical path from one task to a controlled rollout.",
    items: [
      {
        title: "Automation assessment",
        text: "A process map, feasibility findings, integration requirements, and a proposed first workflow."
      },
      {
        title: "A bounded pilot",
        text: "One use case with evaluation cases, review controls, and a decision point before wider use."
      },
      {
        title: "A workflow extension",
        text: "Add a connected step to an established automation with updated permissions, monitoring, and operating guidance."
      }
    ]
  },
  preparation: {
    title: "Bring the task people keep repeating.",
    text: "A walkthrough and a few anonymized examples help establish whether the task is suitable for automation. The awkward cases matter: they show where a workflow needs a person, a rule, or a safe way to stop.",
    items: [
      "The current steps, approximate task volume, and time spent reviewing",
      "Anonymized examples of normal inputs and difficult exceptions",
      "The systems involved, allowed actions, and data-handling requirements"
    ]
  },
  faqTitle: "Questions about AI automation.",
  faqs: [
    {
      title: "Does my workflow need AI?",
      text: "Not necessarily. If inputs and decisions are predictable, rules and standard integrations may be enough. I consider AI where interpretation is useful and assess whether its accuracy, review effort, and operating costs suit the task."
    },
    {
      title: "Can you connect the tools we already use?",
      text: "I first review supported APIs, webhooks, authentication, permissions, rate limits, and test access. The workflow can only promise actions those systems allow. Where a supported connection is missing, that constraint is made explicit before implementation."
    },
    {
      title: "How do you deal with incorrect AI output?",
      text: "The design uses structured outputs, business-rule checks, representative evaluations, and review queues where needed. Formatting checks alone cannot establish factual accuracy, so source verification and the impact of an error influence how much review is required."
    },
    {
      title: "Can the automation make changes without asking a person?",
      text: "Only for actions explicitly approved in the scope. Consequential changes can require human approval, and the workflow's access is limited to the operations it needs. Pause controls and a clear exception path are part of the design."
    },
    {
      title: "What happens to the data sent to a model provider?",
      text: "We review what information is necessary, which provider is involved, and your requirements for processing and retention before implementation. Redaction or a different deployment approach may be needed. Production data is not the default starting material for a pilot."
    },
    {
      title: "How will we know if the pilot is worth continuing?",
      text: "We agree on a manual baseline and compare completion, errors, review effort, and running costs. The pilot should show whether the complete workflow is useful, including the human work required to keep it dependable."
    },
    {
      title: "What ongoing costs should we plan for?",
      text: "Possible costs include model usage, hosting, storage, integration subscriptions, and operational review. I document the usage assumptions and monitoring needs so the cost of running the workflow is visible alongside the build fee."
    },
    {
      title: "Can the workflow be changed or paused after launch?",
      text: "Yes, within the controls included in the implementation. The handover explains how to pause processing, review failed jobs, and change agreed settings. Larger changes to prompts, models, or permissions should be checked against the evaluation cases before release."
    }
  ],
  related: [
    "data-analytics",
    "custom-software-development",
    "crm-implementation"
  ],
  projectSlugs: [
    "ai-vision-lab"
  ],
  articles: [
    {
      title: "Choose an automation pilot you can evaluate",
      text: "Start with a bounded task, representative examples, and a baseline that includes manual review effort."
    },
    {
      title: "Design the exception queue before the happy path",
      text: "Give failed and uncertain cases an owner, a reason, and a clear next action."
    },
    {
      title: "Calculate the cost of the whole workflow",
      text: "Include processing, subscriptions, review time, and support when judging whether automation is useful."
    }
  ]
};
