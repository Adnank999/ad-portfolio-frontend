import type { AIUsage } from '@/lib/ai-content/contracts'

const tokens = new Intl.NumberFormat('en-US')
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 8 })
const rates = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 })

export function AIGenerationUsage({ generations }: { generations: (AIUsage | null)[] }) {
  const latest = generations.at(-1)
  const recorded = generations.filter((usage): usage is AIUsage => usage !== null)
  const completeCost = recorded.length === generations.length && recorded.every((usage) => usage.estimatedCost !== null)
  const sessionTokens = recorded.reduce((total, usage) => total + usage.totalTokens, 0)
  const sessionCost = recorded.reduce((total, usage) => total + (usage.estimatedCost?.totalUsd ?? 0), 0)
  if (!generations.length) return null

  return <section aria-label="AI generation usage" className="space-y-4 rounded-xl border border-accent-400/20 bg-accent-500/[0.04] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-accent-100"><span className="accent-text">Tokens &amp; estimated cost</span></h3><span className="text-[10px] text-zinc-400">Latest successful request{latest ? ` · ${latest.model}` : ''}</span></div>
    {latest ? <>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Input tokens" value={tokens.format(latest.inputTokens)} detail={`${tokens.format(latest.cachedInputTokens)} cached (included)`} />
        <Metric label="Output tokens" value={tokens.format(latest.outputTokens)} detail={`${tokens.format(latest.thinkingTokens)} thinking (included)`} />
        <Metric label="Total tokens" value={tokens.format(latest.totalTokens)} detail="Reported by Gemini" />
        <Metric label="Estimated cost (USD)" value={latest.estimatedCost ? dollars.format(latest.estimatedCost.totalUsd) : 'Unavailable'} detail={latest.estimatedCost ? `Input ${dollars.format(latest.estimatedCost.inputUsd)} · Output ${dollars.format(latest.estimatedCost.outputUsd)}` : 'Pricing is not configured or accounting is incomplete.'} />
      </dl>
      {latest.estimatedCost && <p className="text-[10px] leading-5 text-zinc-400">Rates per 1M tokens: input {rates.format(latest.estimatedCost.inputUsdPerMillion)} · cached input {rates.format(latest.estimatedCost.cachedInputUsdPerMillion)} · output including thinking {rates.format(latest.estimatedCost.outputUsdPerMillion)}.</p>}
    </> : <p className="text-xs leading-6 text-zinc-400">Token usage is unavailable. No provider request was needed, or the provider did not return usable usage metadata.</p>}
    {generations.length > 1 && <p className="border-t border-white/10 pt-3 text-xs leading-6 text-zinc-300">This session: {generations.length} successful generations · {tokens.format(sessionTokens)} reported tokens · {completeCost ? `${dollars.format(sessionCost)} estimated` : 'total cost unavailable'}.{recorded.length !== generations.length ? ' Some requests have no usage metadata.' : ''}</p>}
    <p className="text-[10px] leading-5 text-zinc-500">Token-only estimate, not your invoice. Free-tier allowances, discounts, taxes, and other charges may differ. Session totals reset when this dialog closes and exclude failed or cancelled requests.</p>
  </section>
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="min-w-0 space-y-1"><dt className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</dt><dd className="break-words text-xl font-semibold tabular-nums text-white">{value}</dd><dd className="text-[10px] leading-5 text-zinc-500">{detail}</dd></div>
}
