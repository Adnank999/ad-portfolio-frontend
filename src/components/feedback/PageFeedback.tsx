import { useId, useState } from 'react'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import './page-feedback.css'
import { LoadingLogo } from './loading-logo/LoadingLogo'

type FeedbackSize = 'page' | 'panel'

function FeedbackArtwork() {
  return <div className="page-feedback-art" aria-hidden="true">
    <div className="page-feedback-halo" />
    <div className="page-feedback-orbit"><i /><i /><i /></div>
    <div className="page-feedback-core" />
  </div>
}

export function PageLoading({ message = 'Loading…', size = 'page', className = '' }: {
  message?: string
  size?: FeedbackSize
  className?: string
}) {
  return <div className={`page-feedback page-feedback--loading page-feedback--${size} ${className}`} aria-busy="true">
    <div className="page-feedback-content">
      <LoadingLogo />
      <p className="page-feedback-status" data-long-message={message.length > 30 || undefined} role="status" aria-live="polite" aria-atomic="true">{message}</p>
    </div>
  </div>
}

export function PageLoadError({ onRetry, size = 'page' }: {
  onRetry: () => void | Promise<unknown>
  size?: FeedbackSize
}) {
  const headingId = useId()
  const [retrying, setRetrying] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)
  const Heading = size === 'panel' ? 'h2' : 'h1'

  async function retry() {
    if (retrying) return
    setRetrying(true)
    setRetryFailed(false)
    try {
      await onRetry()
    } catch {
      setRetryFailed(true)
    } finally {
      setRetrying(false)
    }
  }

  return <section className={`page-feedback page-feedback--error page-feedback--${size}`} aria-labelledby={headingId}>
    <div className="page-feedback-content">
      <FeedbackArtwork />
      <p className="page-feedback-eyebrow">Something went wrong</p>
      <Heading id={headingId}>A brief interruption.</Heading>
      <p className="page-feedback-description" role="alert">We couldn’t load this content right now. Please try again, or come back in a moment.</p>
      <div className="page-feedback-actions">
        <button type="button" onClick={() => void retry()} disabled={retrying} aria-busy={retrying}>
          <RotateCcw size={15} aria-hidden="true" />{retrying ? 'Trying again…' : 'Try again'}
        </button>
        <a href="/">Back to home <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
      <p className="page-feedback-retry-status" role="status" aria-live="polite">{retryFailed ? 'Still unable to connect. Please try again shortly.' : retrying ? 'Reconnecting…' : ''}</p>
    </div>
  </section>
}
