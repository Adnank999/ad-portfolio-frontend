import { useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react'
import { sendContactFn } from '@/server/contact'
import { contactEmail, contactWhatsApp, enquirySchema, type ContactResult, type ContactSubmission } from './contact-channels'
import './contact-page.css'

type Props = {
  email?: string | null
  whatsapp?: string | null
  sendEnquiry?: (input: ContactSubmission) => Promise<ContactResult>
}
const sendEnquiry = (data: ContactSubmission) => sendContactFn({ data })

export function ContactPage({ email = contactEmail, whatsapp = contactWhatsApp, sendEnquiry: send = sendEnquiry }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const attempt = useRef<{ payload: string; id: string } | null>(null)
  const feedback = useRef<HTMLParagraphElement>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const result = enquirySchema.safeParse({ name: fields.get('name'), email: fields.get('email'), subject: fields.get('subject'), message: fields.get('message') })
    setSent(false)
    if (!result.success) {
      setError(result.error.issues[0].message)
      requestAnimationFrame(() => feedback.current?.focus())
      return
    }
    busy.current = true
    setSending(true)
    setError('')
    try {
      const payload = JSON.stringify(result.data)
      // Reuse the key after an uncertain response; edits start a new enquiry.
      if (attempt.current?.payload !== payload) attempt.current = { payload, id: crypto.randomUUID() }
      const response = await send({ ...result.data, requestId: attempt.current.id, website: String(fields.get('website') ?? '') })
      if (!response.ok) { setError(response.message); return }
      form.reset()
      attempt.current = null
      setSent(true)
    } catch {
      setError('Your enquiry could not be confirmed. Your message is still here; please try again shortly.')
    } finally {
      busy.current = false
      setSending(false)
      requestAnimationFrame(() => feedback.current?.focus())
    }
  }

  return <main className="contact-page" id="contact"><div className="contact-page-wrap">
    <div className="contact-page-grid"><header className="contact-intro">
      <p className="contact-eyebrow"><i aria-hidden="true" /> Get in touch</p>
      <h1>Let’s talk about<br /><em>your next idea.</em></h1>
      <p className="contact-summary">Have a question or a project in mind? Send me a message and I’ll get back to you by email.</p>
      {(email || whatsapp) && <div className="contact-direct">{email && <a href={`mailto:${email}`}><Mail size={18} aria-hidden="true" />{email}<ArrowUpRight size={16} aria-hidden="true" /></a>}{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" />Chat on WhatsApp<ArrowUpRight size={16} aria-hidden="true" /></a>}</div>}
    </header><section className="contact-brief" aria-labelledby="brief-title">
      <h2 id="brief-title">Send a message</h2>
      <p className="contact-form-intro">Straight to my inbox. No account needed.</p>
      <form onSubmit={submit} onChange={() => { setSent(false); setError('') }} aria-busy={sending}>
        <fieldset disabled={sending} className="contact-form-fields">
          <legend className="sr-only">Your enquiry</legend>
          <div className="contact-fields"><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Your name" /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label></div>
          <label>Subject<input name="subject" required minLength={2} maxLength={160} placeholder="What would you like to discuss?" /></label>
          <label>Message<textarea name="message" required minLength={10} maxLength={4000} rows={5} placeholder="Tell me a little about it…" /></label>
          <div className="contact-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" maxLength={200} /></label></div>
          <button type="submit" disabled={sending} className="contact-primary">{sending ? 'Sending…' : 'Send message'}<ArrowUpRight size={19} aria-hidden="true" /></button>
        </fieldset>
        <p className="contact-form-note">Your details are used only to respond to your enquiry.</p>
      </form>
      <p ref={feedback} tabIndex={-1} role={error ? 'alert' : 'status'} className={error ? 'contact-form-error' : 'contact-form-status'}>{error || (sent ? 'Thank you — your enquiry has been sent. I’ll reply by email.' : '')}</p>
    </section></div>
  </div></main>
}
