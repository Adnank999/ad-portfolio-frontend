import { useState, type FormEvent } from 'react'
import { ArrowDownRight, ArrowUpRight, Check, Copy, Mail, MessageCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { contactEmail, contactWhatsApp, enquiryMailto, enquirySchema, enquiryTypes, formatEnquiry, type Enquiry } from './contact-channels'
import './contact-page.css'

export function ContactPage({ email = contactEmail, whatsapp = contactWhatsApp }: { email?: string | null; whatsapp?: string | null }) {
  const [interest, setInterest] = useState<Enquiry['interest']>(enquiryTypes[0])
  const [draft, setDraft] = useState<Enquiry | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const result = enquirySchema.safeParse({ name: fields.get('name'), email: fields.get('email'), message: fields.get('message'), timeline: fields.get('timeline'), interest })
    setCopied(false)
    if (!result.success) { setError(result.error.issues[0].message); setDraft(null); return }
    setError('')
    setDraft(result.data)
  }

  async function copy() {
    if (!draft) return
    try { await navigator.clipboard.writeText(formatEnquiry(draft)); setCopied(true); setError('') }
    catch { setError('Your browser could not copy the brief. Select the text below and copy it manually.') }
  }

  return <main className="contact-page" id="contact"><div className="contact-page-wrap">
    <p className="contact-eyebrow"><i aria-hidden="true" /> Good things start with a conversation</p>
    <div className="contact-page-grid"><div className="contact-intro">
      <h1>Something in mind?<br />Let’s make it <em>matter.</em></h1>
      <p className="contact-summary">A new idea. A product that needs a next chapter. A problem worth solving. Tell me where you want to go — we’ll work out the next step together.</p>
      <a href="#project-brief" className="contact-jump">Tell me about it <ArrowDownRight size={20} aria-hidden="true" /></a>
      <div className="contact-next"><h2>A conversation, not a commitment.</h2><ol>
        <li><small>01</small><p>Share the idea.<br /><strong>Rough notes are welcome.</strong></p></li>
        <li><small>02</small><p>Find the right fit.<br /><strong>We discuss goals, scope and timing.</strong></p></li>
        <li><small>03</small><p>Choose a clear next step.<br /><strong>No pressure. No guessing.</strong></p></li>
      </ol></div>
      <Link to="/case-studies" className="contact-work-link">A little context before we talk <ArrowUpRight size={17} aria-hidden="true" /></Link>
    </div><section id="project-brief" className="contact-brief" aria-labelledby="brief-title">
      <p className="contact-eyebrow">Your next chapter / Start here</p><h2 id="brief-title">Tell me what you’re thinking.</h2>
      <p className="contact-form-intro">A few details now make our first conversation more useful.</p>
      <form onSubmit={prepare} onChange={() => { setDraft(null); setCopied(false) }}>
        <fieldset className="contact-interests"><legend>I’m looking for help with</legend>{enquiryTypes.map(type => <button key={type} type="button" aria-pressed={interest === type} onClick={() => { setInterest(type); setDraft(null) }}>{type}</button>)}</fieldset>
        <div className="contact-fields"><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="What should I call you?" /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label></div>
        <label>A little about the project<textarea name="message" required minLength={20} maxLength={4000} rows={4} placeholder="What are you working on? What would you like to change or create?" /></label>
        <label>When are you thinking?<select name="timeline" defaultValue="Exploring options"><option>Exploring options</option><option>Within a month</option><option>Within three months</option><option>Flexible</option></select></label>
        <button type="submit" className="contact-primary">Prepare my enquiry <ArrowUpRight size={19} aria-hidden="true" /></button>
        <p className="contact-form-note">This prepares a brief, not a submission. You choose how to send it in the next step.</p>
      </form>
      {error && <p role="alert" className="contact-form-error">{error}</p>}
      {draft && <div className="contact-draft" role="status"><h3>Your brief is ready.</h3><p>{email ? 'Open your email draft, review it, then press Send in your email app.' : 'Copy your brief to share it through your preferred contact channel. Email delivery is not configured yet.'}</p><div className="contact-draft-actions">
        {email && <a className="contact-primary" href={enquiryMailto(email, draft)}><Mail size={17} aria-hidden="true" />Open email draft</a>}
        <button type="button" onClick={copy}>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copied ? 'Brief copied' : 'Copy brief'}</button>
      </div><details><summary>Review the prepared brief</summary><pre>{formatEnquiry(draft)}</pre></details></div>}
      {(email || whatsapp) && <div className="contact-direct"><p>Prefer to keep it simple?</p>{email && <a href={`mailto:${email}`}><Mail size={17} aria-hidden="true" />{email}<ArrowUpRight size={15} aria-hidden="true" /></a>}{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" />Chat on WhatsApp<ArrowUpRight size={15} aria-hidden="true" /></a>}</div>}
    </section></div>
  </div></main>
}
