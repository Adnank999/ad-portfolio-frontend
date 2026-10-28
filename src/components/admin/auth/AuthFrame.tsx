import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/admin/ui/card'
import './auth.css'

export function AuthFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <main className="auth-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080b] px-4 py-16 text-white">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(217,70,239,.16),transparent_42%)]" />
    <div className="relative w-full max-w-md">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"><ArrowLeft size={14} /> Back to portfolio</Link>
      <Card className="overflow-hidden border-white/12 bg-[#131317]">
        <CardContent className="p-7 sm:p-9">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[.22em] text-accent-400"><span className="accent-text">Adnan / Workspace</span></span>
            <ShieldCheck size={19} className="text-zinc-500" aria-hidden="true" />
          </div>
          <p className="mb-3 text-[10px] uppercase tracking-[.2em] text-zinc-500">{eyebrow}</p>
          <h1 className="text-5xl leading-[.9] sm:text-6xl">{title}</h1>
          <p className="mt-4 text-xs leading-6 text-zinc-400">{description}</p>
          <div className="mt-8">{children}</div>
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-[10px] text-zinc-600">Secure access to content and project tools.</p>
    </div>
  </main>
}

export function FormError({ error }: { error: unknown }) {
  if (!error) return null
  return <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs leading-5 text-red-200">{error instanceof Error ? error.message : 'Something went wrong. Please try again.'}</p>
}
