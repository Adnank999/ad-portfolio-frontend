import { useState, type FormEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthFrame, FormError } from '@/components/admin/auth/AuthFrame'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { useResetPassword } from '@/queries/auth/auth'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === 'string' ? search.token : '' }),
  head: () => ({ meta: [{ title: 'Choose a password · Portfolio workspace' }, { name: 'robots', content: 'noindex,nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const reset = useResetPassword()
  const [done, setDone] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirm')) { setMismatch(true); return }
    setMismatch(false)
    try {
      await reset.mutateAsync({ token, password: String(form.get('password')) })
      setDone(true)
    } catch {}
  }
  return <AuthFrame eyebrow="Account recovery" title="New password." description="Set a strong new password. Your previous sessions will be signed out.">
    {!token ? <p role="alert" className="text-sm text-red-200">This reset link is missing its token. Request a new link.</p> : done ? <div role="status" className="space-y-5"><p className="text-sm text-zinc-300">Your password was updated. You can sign in now.</p><Button asChild className="w-full"><Link to="/login">Sign in</Link></Button></div> : <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="reset-password">New password</Label><Input id="reset-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></div>
      <div className="space-y-2"><Label htmlFor="reset-confirm">Confirm password</Label><Input id="reset-confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></div>
      {mismatch && <p role="alert" className="text-xs text-red-300">The passwords do not match.</p>}<FormError error={reset.error} /><Button type="submit" disabled={reset.isPending} className="w-full">{reset.isPending ? 'Updating…' : 'Update password'}</Button>
    </form>}
    <p className="mt-6 text-center text-xs"><Link to="/login" className="text-accent-300 hover:text-accent-200"><span className="accent-text">Back to sign in</span></Link></p>
  </AuthFrame>
}
