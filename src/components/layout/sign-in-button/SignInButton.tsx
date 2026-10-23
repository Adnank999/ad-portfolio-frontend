import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { meOptions, useLogout } from '@/queries/auth/auth'
import './sign-in-button.css'

export function SignInButton() {
  const { data: account, isPending } = useQuery(meOptions())
  const logout = useLogout()
  const [signOutFailed, setSignOutFailed] = useState(false)

  async function signOut() {
    setSignOutFailed(false)
    try {
      await logout.mutateAsync()
    } catch {
      setSignOutFailed(true)
    }
  }

  if (isPending) return <div className="site-account site-account-pending" role="status" aria-label="Checking account" />
  if (account) return <div className="site-account">
    <span className="site-account-name" title={account.name}>{account.name}</span>
    <button type="button" className="site-sign-in" onClick={() => void signOut()} disabled={logout.isPending}>
      {logout.isPending ? 'Signing out…' : 'Log out'}
    </button>
    {signOutFailed && <span className="site-account-error" role="alert">Unable to sign out. Please try again.</span>}
  </div>

  return <div className="site-account"><Link to="/login" className="site-sign-in" aria-label="Sign in to your account">
    <span className="site-sign-in-indicator" aria-hidden="true" />
    <span>Sign in</span>
    <ArrowUpRight size={17} aria-hidden="true" />
  </Link></div>
}
