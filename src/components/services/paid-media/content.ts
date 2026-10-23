import type { ServiceContent } from "@/components/global/service-page/servicePage.types";

export const paidMediaContent: ServiceContent = {
  slug: "paid-media",
  category: "Growth & discoverability",
  title: "Paid Media & Conversion Foundations",
  summary: "Connect campaign landing pages, lead capture, and measurement so the journey after an ad click is ready for real customers.",
  artwork: "growth",
  overview: {
    title: "Make the experience after the click ready for the campaign.",
    text: "An ad sets an expectation. The landing page, form, confirmation, and follow-up need to carry it through. I build the technical side of that journey: focused pages, reliable lead delivery, and agreed conversion measurement. This service can sit alongside your marketer or agency, with media buying, creative production, and campaign management owned explicitly by the people responsible for them.",
    definitions: [
      {
        title: "A connected conversion journey",
        text: "Match the landing page to the offer, make the next action clear, and ensure the resulting enquiry or registration reaches the right destination."
      },
      {
        title: "Measurement with a defined meaning",
        text: "Agree on what counts as a conversion, when an event should fire, and how it relates to the customer outcome you care about."
      }
    ]
  },
  challenge: {
    title: "Check the full journey before sending more traffic.",
    before: [
      "The ad and landing page make different promises.",
      "Forms accept an enquiry, but nobody can confirm it reached the CRM.",
      "Button clicks and successful submissions are counted as the same result."
    ],
    after: [
      "Keep the offer, audience, and next step consistent across the journey.",
      "Validate delivery, assignment, confirmation, and failure handling.",
      "Define and test distinct events for the actions the business needs to measure."
    ]
  },
  offerings: {
    title: "Technical delivery for the journey after an ad click.",
    items: [
      {
        title: "Campaign landing pages",
        text: "Build responsive pages around an approved audience, offer, message, and primary action."
      },
      {
        title: "Forms & conversion flows",
        text: "Implement field validation, error recovery, confirmation states, and the steps needed to complete an enquiry or registration."
      },
      {
        title: "Lead delivery & CRM integration",
        text: "Route validated submissions into the agreed customer workflow, with source context and a visible failure path."
      },
      {
        title: "Event implementation",
        text: "Add the agreed measurement events and parameters, then test firing conditions, duplicate handling, and consent-dependent behavior."
      },
      {
        title: "Experiment setup",
        text: "Prepare an agreed page variant or test with a clear hypothesis, primary measure, and operational owner."
      },
      {
        title: "Reporting connections",
        text: "Connect available campaign and customer signals in a view that distinguishes clicks, enquiries, and later business outcomes."
      }
    ]
  },
  deliverables: {
    title: "A campaign journey that has been checked end to end.",
    items: [
      {
        title: "Page & measurement brief",
        text: "An approved offer, page structure, conversion definition, event map, and ownership of creative, tracking, and campaign decisions."
      },
      {
        title: "Landing experience & connections",
        text: "The scoped page, form, confirmation, and integrations, checked across relevant devices and success and failure states."
      },
      {
        title: "Launch & reporting handover",
        text: "Event validation notes, campaign source conventions, integration operating instructions, and known measurement limitations."
      }
    ],
    acceptance: "We complete a test conversion from the landing page through the agreed destination. Checks cover field validation, confirmation, duplicate events, lead delivery, and the tracking behavior expected under the approved consent settings."
  },
  spotlight: {
    title: "A useful lead should arrive with useful context.",
    text: "An enquiry needs more than a name and email address. The receiving team may need the service requested, the landing page, and the relevant campaign source. Planning those fields helps connect acquisition work to a practical follow-up.",
    points: [
      "A clear offer and primary page action",
      "Source information carried through the handoff",
      "Confirmation that the destination received the enquiry"
    ]
  },
  sectors: [
    "Service enquiries",
    "SaaS acquisition",
    "Commerce campaigns",
    "Product launches",
    "Event registration",
    "B2B lead generation"
  ],
  tools: [
    "Landing pages",
    "Event tracking",
    "CRM APIs",
    "Analytics",
    "Consent workflows",
    "Experiment planning"
  ],
  approach: {
    title: "Focus on the gap between the click and the customer.",
    items: [
      {
        title: "A campaign needs a dedicated landing page",
        text: "Build a page that continues the approved message and gives visitors the information needed to take one clear action."
      },
      {
        title: "Leads are difficult to trace",
        text: "Review form delivery, source fields, duplicate records, and assignment so the team can see where an enquiry came from and who owns it."
      },
      {
        title: "Conversion counts are confusing",
        text: "Separate interaction events from completed submissions and review when each event fires before using the numbers to make campaign decisions."
      }
    ]
  },
  process: [
    "Discuss the campaign audience, offer, primary action, and the people responsible for media, creative, approvals, and technical delivery.",
    "Review the current landing journey, form behavior, event setup, consent requirements, and destination workflow. Identify gaps that affect launch readiness.",
    "Agree on the page content, conversion definition, field mappings, event plan, and acceptance checks before implementation.",
    "Build and test the scoped experience across relevant devices. Verify successful and failed submissions, lead delivery, and the agreed tracking behavior.",
    "Complete the handover and review available visitor and lead-quality feedback. Further experiments follow an agreed hypothesis and measurement plan."
  ],
  engagement: {
    title: "A focused build around your campaign's next step.",
    items: [
      {
        title: "Landing page launch",
        text: "An agreed campaign page with its form, confirmation, and required destination connections."
      },
      {
        title: "Measurement & integration project",
        text: "A defined set of events or lead-delivery changes, with validation and operating notes."
      },
      {
        title: "Conversion journey improvement",
        text: "A bounded set of changes to an existing page or flow based on observed friction and a clear review measure."
      }
    ]
  },
  preparation: {
    title: "Bring the offer and the action you want a visitor to take.",
    text: "An approved campaign message and a clear destination for enquiries make the first milestone easier to define. If a marketer or agency owns the campaign, include their launch and measurement requirements in the brief.",
    items: [
      "The campaign audience, offer, approved copy, and creative assets",
      "The conversion action, form fields, and CRM or registration destination",
      "Launch timing, tracking requirements, and approval owners"
    ]
  },
  faqTitle: "Questions about paid media and conversion support.",
  faqs: [
    {
      title: "Do you manage advertising accounts and budgets?",
      text: "My primary scope here is landing pages, integrations, and technical measurement. Media buying, budget decisions, and ongoing account management need a separate, explicit agreement. I can work alongside the person or agency already responsible for those activities."
    },
    {
      title: "Can you build a landing page for an existing campaign?",
      text: "Yes. We agree on the audience, approved offer, content, primary action, and launch requirements. The page can connect to your current forms, CRM, or other supported destination systems."
    },
    {
      title: "Can leads go directly into our CRM?",
      text: "Where the CRM provides a suitable integration, the flow can include field mapping, validation, source information, and assignment. Failed deliveries need a visible recovery path so a successful form response does not hide a lost enquiry."
    },
    {
      title: "What counts as a conversion?",
      text: "We define that together before adding tracking. It may be a confirmed enquiry, completed registration, or another meaningful action. A button click is recorded separately when it does not prove that the intended outcome happened."
    },
    {
      title: "Will reporting match perfectly across every platform?",
      text: "Not necessarily. Different event definitions, attribution rules, consent choices, and incomplete data can produce differences. The implementation documents what each signal represents and which limitations need to be considered when comparing reports."
    },
    {
      title: "How do you handle consent and tracking requirements?",
      text: "You provide the approved tracking and data-handling requirements. I implement the agreed behavior and verify event firing under the relevant consent states. Decisions about what data may be collected are established before tags or integrations are enabled."
    },
    {
      title: "Can you guarantee more leads or a return on ad spend?",
      text: "No fixed return is promised. The offer, audience, creative, campaign settings, follow-up, and market conditions also influence results. The engagement is scoped around the technical work, its validation, and any agreed experiment."
    },
    {
      title: "Are media spend, creative, and software subscriptions included?",
      text: "They are separate unless explicitly listed in the agreement. The proposal identifies the development scope and dependencies, including campaign assets, tracking tools, CRM access, hosting, and any required paid services."
    }
  ],
  related: [
    "web-development",
    "seo",
    "crm-implementation"
  ],
  articles: [
    {
      title: "Check the full journey after the ad click",
      text: "Review the offer, form, confirmation, and lead destination before launching traffic."
    },
    {
      title: "Define the conversion before implementing the event",
      text: "Separate visitor interactions from completed actions the business can verify."
    },
    {
      title: "Keep campaign context with the lead",
      text: "Plan source fields and CRM ownership so useful enquiries reach the right follow-up."
    }
  ]
};
