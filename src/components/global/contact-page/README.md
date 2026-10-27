# Contact page

Editorial enquiry page with project-type choices, name/email, a short brief and timing. Input is validated before creating a draft. Visitors review it and open their email app or copy the brief; the page never claims a message was submitted or delivered. Nothing is persisted by the application.

Configure public build-time VITE_CONTACT_EMAIL with the receiving address. Optionally set VITE_CONTACT_WHATSAPP to an international number containing digits only (no +). Both are public contact information, not secrets. Rebuild the frontend after setting them. Until a real recipient is configured, the page offers a copyable brief and explicitly says email delivery is unavailable. The footer reuses the same configuration.
