import { useState, type FormEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthFrame, FormError } from '@/components/admin/auth/AuthFrame'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { useForgotPassword } from '@/queries/auth/auth'

export const Route = createFileRoute('/forgot-password')({ head: () => ({ meta: [{ title: 'Reset password · Portfolio workspace' }, { name: 'robots', content: 'noindex,nofollow' }] }), component: ForgotPasswordPage })

function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const [done, setDone] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await forgot.mutateAsync({ email: String(new FormData(event.currentTarget).get('email')) })
      setDone(true)
    } catch {}
  }
  return <AuthFrame eyebrow="Account recovery" title="Reset access." description="Enter your account email. If it exists, we’ll send a link that expires in 15 minutes.">
    {done ? <p role="status" className="rounded-lg border border-accent-400/20 bg-accent-400/10 p-4 text-xs leading-6 text-accent-100"><span className="accent-text">If the account exists, a reset link is on its way. Check your inbox.</span></p> : <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="forgot-email">Email address</Label><Input id="forgot-email" name="email" type="email" autoComplete="email" required /></div><FormError error={forgot.error} /><Button type="submit" disabled={forgot.isPending} className="w-full">{forgot.isPending ? 'Sending…' : 'Send reset link'}</Button></form>}
    <p className="mt-6 text-center text-xs"><Link to="/login" className="text-accent-300 hover:text-accent-200"><span className="accent-text">Back to sign in</span></Link></p>
  </AuthFrame>
}
