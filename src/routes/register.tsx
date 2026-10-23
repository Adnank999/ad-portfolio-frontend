import { useState, type FormEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthFrame, FormError } from '@/components/admin/auth/AuthFrame'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { useRegister } from '@/queries/auth/auth'

export const Route = createFileRoute('/register')({ head: () => ({ meta: [{ title: 'Register · Portfolio workspace' }, { name: 'robots', content: 'noindex,nofollow' }] }), component: RegisterPage })

function RegisterPage() {
  const register = useRegister()
  const [done, setDone] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await register.mutateAsync({ name: String(form.get('name')), email: String(form.get('email')), password: String(form.get('password')) })
      setDone(true)
    } catch {}
  }
  return <AuthFrame eyebrow="Create account" title="Join the workspace." description="New accounts have no admin permissions. An owner can grant access after registration.">
    {done ? <div role="status" className="space-y-5"><p className="text-sm text-zinc-300">Your account is ready. Sign in to continue.</p><Button asChild className="w-full"><Link to="/login">Go to sign in</Link></Button></div> : <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="register-name">Name</Label><Input id="register-name" name="name" autoComplete="name" maxLength={120} required /></div>
      <div className="space-y-2"><Label htmlFor="register-email">Email address</Label><Input id="register-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="space-y-2"><Label htmlFor="register-password">Password</Label><Input id="register-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><p className="text-[10px] text-zinc-600">At least 12 characters.</p></div>
      <FormError error={register.error} /><Button type="submit" disabled={register.isPending} className="w-full">{register.isPending ? 'Creating account…' : 'Create account'}</Button>
    </form>}
    <p className="mt-6 text-center text-xs text-zinc-500">Already registered? <Link to="/login" className="text-accent-300 hover:text-accent-200"><span className="accent-text">Sign in</span></Link></p>
  </AuthFrame>
}
