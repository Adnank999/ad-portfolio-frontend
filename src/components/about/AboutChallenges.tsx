import { useId, useState } from 'react'
import { ArrowDownRight, Minus, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

const challenges = [
  {
    title: 'Millions of images. Useful hotel content.', category: 'VervTrip / AI image classification',
    problem: 'A collection of 6M+ hotel images across 400k+ hotels needed automated classification to make the visual content more useful for the product.',
    approach: 'Developed an AI-powered image-classification pipeline using Gemini 2.5 Flash Lite, connecting model processing to the hotel image workflow rather than treating each image as a manual task.',
    tradeoff: 'At this volume, model cost, throughput, and output quality all matter. Classification needs to fit the data pipeline, not become another bottleneck.',
    tools: ['Gemini 2.5 Flash Lite', 'AI image classification', 'Hotel imagery'],
  },
  {
    title: 'A payment received. A booking accounted for.', category: 'VervTrip / Booking and payment reconciliation',
    problem: 'A payment event and a supplier booking response do not always arrive together. Checkout needs a clear account of what was paid, what was booked, and what still needs reconciliation.',
    approach: 'Connected booking and payment workflows with transaction records, validated API responses, webhook-based confirmations, and background reconciliation work.',
    tradeoff: 'A successful payment is not the same as a confirmed reservation. Keep those states distinct so delayed responses and exceptions can be handled without misleading the customer.',
    tools: ['Laravel', 'Payment webhooks', 'Transaction records', 'Reconciliation jobs'],
  },
  {
    title: 'Heavy background work. A responsive product.', category: 'VervTrip / Queues and asynchronous processing',
    problem: 'High-volume image processing, booking follow-up, and payment-related work should not make the customer wait for every task to finish in a single request.',
    approach: 'Built backend services, background jobs, queue processing, and Redis-based caching to move longer-running work out of the immediate user journey.',
    tradeoff: 'Moving work into a queue changes when it completes. Failures, retries, and job state need as much attention as the request that started the work.',
    tools: ['Laravel', 'Background jobs', 'Queue processing', 'Redis'],
  },
  {
    title: 'One hotel catalogue. Many ways to discover it.', category: 'VervTrip / Dynamic hotel pages',
    problem: 'Travellers look for hotels by city, popular place, and brand. A growing catalogue needs to support those entry points without maintaining every page by hand.',
    approach: 'Built dynamic hotel pages that reuse hotel data and page structure while adapting the content and results to cities, popular places, and hotel brands.',
    tradeoff: 'Reusable templates should not make every destination feel interchangeable. Keep the place-specific context and hotel information useful as the catalogue changes.',
    tools: ['Laravel', 'React', 'Dynamic pages', 'Hotel catalogue'],
  },
  {
    title: 'Cashback that follows the business rules.', category: 'VervTrip / Cashback and wallet engine',
    problem: 'Cashback is more than a number at checkout. Eligibility, campaign rules, wallet transactions, and abuse prevention all need to work together.',
    approach: 'Developed automated cashback and wallet functionality around campaign rules, transaction processing, fraud detection, and analytics.',
    tradeoff: 'Reward flexibility cannot come at the expense of clear accounting. The engine needs understandable rules and transaction records as campaigns evolve.',
    tools: ['Campaign rules', 'Wallet transactions', 'Fraud detection', 'Analytics'],
  },
  {
    title: 'Crypto checkout. The same booking confidence.', category: 'VervTrip / Coinbase Commerce',
    problem: 'Adding crypto payments introduces another provider and confirmation lifecycle, but the customer still needs a clear and secure booking experience.',
    approach: 'Integrated Coinbase Commerce into payment workflows, connecting provider events, webhook confirmations, and application transaction state.',
    tradeoff: 'A provider callback is only one part of the flow. Validation, confirmation state, and booking reconciliation still need to agree before the application treats the journey as complete.',
    tools: ['Coinbase Commerce', 'Payment integration', 'Webhooks', 'API validation'],
  },
  {
    title: 'Useful place data. Fewer unnecessary requests.', category: 'Maps integrations / Google Places API',
    problem: 'Place lookups can become an expensive, tightly coupled dependency when the same information is requested repeatedly or too early in a user flow.',
    approach: 'Optimized Google Places and Maps API usage by reducing repeated requests, reusing relevant results, and reviewing where the product actually depends on external place data.',
    tradeoff: 'Request reduction should preserve useful, current information. Cache and lookup boundaries need to follow the workflow and the provider’s data-use requirements.',
    tools: ['Google Places API', 'Google Maps', 'API optimization', 'Dependency boundaries'],
  },
]

export function AboutChallenges() {
  const [expanded, setExpanded] = useState<number | null>(0)
  const identifier = useId()

  return <section id="about-challenges" className="about-showcase about-challenges about-container" aria-labelledby="about-challenges-title">
    <header className="about-showcase-heading">
      <p className="about-label">06 / What I’ve solved</p>
      <h2 id="about-challenges-title">Real-world<br /><em className="accent-text-gradient">technical challenges.</em></h2>
      <p className="about-body">Real product work means connecting the parts that rarely appear in a screenshot: hotel imagery, payment state, background jobs, discovery pages, and the rules behind customer rewards.</p>
    </header>
    <div className="about-challenge-list">{challenges.map((challenge, index) => {
      const isExpanded = expanded === index
      const triggerId = `${identifier}-challenge-${index}`
      const panelId = `${triggerId}-panel`
      return <article key={challenge.title} className="about-challenge" data-expanded={isExpanded}>
        <h3><button id={triggerId} type="button" aria-expanded={isExpanded} aria-controls={panelId} onClick={() => setExpanded(isExpanded ? null : index)}>
          <span className="about-challenge-number">0{index + 1}</span><span>{challenge.title}</span>{isExpanded ? <Minus size={21} aria-hidden="true" /> : <Plus size={21} aria-hidden="true" />}
        </button></h3>
        <div id={panelId} className="about-challenge-panel" role="region" aria-labelledby={triggerId} hidden={!isExpanded}>
          <p className="about-label">{challenge.category}</p>
          <div className="about-challenge-breakdown">
            <div><h4>The challenge</h4><p className="about-body">{challenge.problem}</p></div>
            <div><h4>The approach</h4><p className="about-body">{challenge.approach}</p></div>
            <div><h4>The trade-off</h4><p className="about-body">{challenge.tradeoff}</p></div>
          </div>
          <ul className="about-tool-tags" aria-label="Tools and approaches">{challenge.tools.map(tool => <li key={tool}>{tool}</li>)}</ul>
        </div>
      </article>
    })}</div>
    <Link to="/case-studies" className="about-link">Explore the case studies <ArrowDownRight size={19} aria-hidden="true" /></Link>
  </section>
}
