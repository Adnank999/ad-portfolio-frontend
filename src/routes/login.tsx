import { useState, type FormEvent } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AuthFrame, FormError } from '@/components/admin/auth/AuthFrame'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { useLogin } from '@/queries/auth/auth'

export const Route = createFileRoute('/login')({ head: () => ({ meta: [{ title: 'Sign in · Portfolio workspace' }, { name: 'robots', content: 'noindex,nofollow' }] }), component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [notice, setNotice] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const account = await login.mutateAsync({ email: String(form.get('email')), password: String(form.get('password')) })
      if (account.permissions.includes('content:read')) await navigate({ to: '/admin' })
      else setNotice('Signed in. An owner must assign an editor or admin role before you can access the workspace.')
    } catch {}
  }
  return <AuthFrame eyebrow="Welcome back" title="Sign in." description="Use your portfolio account to manage stories, projects, and publishing.">
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="login-email">Email address</Label><Input id="login-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="space-y-2"><div className="flex justify-between"><Label htmlFor="login-password">Password</Label><Link to="/forgot-password" className="text-[11px] text-accent-300 hover:text-accent-200"><span className="accent-text">Forgot password?</span></Link></div><Input id="login-password" name="password" type="password" autoComplete="current-password" required /></div>
      <FormError error={login.error} />
      {notice && <p role="status" className="rounded-lg border border-accent-400/20 bg-accent-400/10 p-3 text-xs text-accent-100"><span className="accent-text">{notice}</span></p>}
      <Button type="submit" disabled={login.isPending} className="w-full">{login.isPending ? 'Signing in…' : 'Sign in'}</Button>
    </form>
    <p className="mt-6 text-center text-xs text-zinc-500">Need an account? <Link to="/register" className="text-accent-300 hover:text-accent-200"><span className="accent-text">Register</span></Link></p>
  </AuthFrame>
}
