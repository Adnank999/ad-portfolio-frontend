# Contact page

Simple enquiry page with name, email, subject and message. Submit calls `src/server/contact.ts`, which validates the same schema, enforces the existing same-origin policy, and forwards JSON to the private Rust API at `POST /api/v1/contact`. Rust sends the email via Resend. There is no draft/copy step or mail-app requirement.

The shared two-red accent is retained in the heading, submit button and decorative glow. Labels, keyboard focus, sending feedback and forced-color states remain accessible. Mobile fields use 16px text. The contact page uses the compact global footer.

Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `CONTACT_TO_EMAIL` in the **backend** `.env.portfolio`; see [Resend deployment setup](../../../../../Backend/deploy/contact-email.md). No Resend key belongs in the frontend or any `VITE_*` setting. The frontend uses its existing runtime `PORTFOLIO_API_URL` and `APP_ORIGIN`. Optional public build-time `VITE_CONTACT_EMAIL` and `VITE_CONTACT_WHATSAPP` only show alternative email/WhatsApp links; they do not control the form's recipient.

The button locks during sending and duplicate submissions are ignored. Errors retain the form values. Retries of unchanged content reuse a UUID sent to Resend as an idempotency key; editing the enquiry changes that key. Success is displayed only after the backend receives a successful Resend response with an email ID. Provider acceptance is not a guarantee of inbox delivery. No contact content is stored in PostgreSQL, and no automatic client acknowledgement email is sent.
