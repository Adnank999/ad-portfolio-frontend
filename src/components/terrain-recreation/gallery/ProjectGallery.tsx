import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, ArrowRight, ExternalLink, Grid2X2, Play, X } from 'lucide-react'
import type { Project, ProjectMedia } from '../../../data/projects'
import { getProjectMedia, isMediaSource, type GalleryLauncherLayout, type GalleryOpenRequest } from './project-media'
import './gallery.css'

type ProjectGalleryProps = {
  project: Project
  ready: boolean
  onActive: (active: boolean) => void
  onLauncherLayout: (layout: GalleryLauncherLayout | null) => void
  openRequest?: GalleryOpenRequest | null
}

function GallerySlide({ item }: { item: ProjectMedia }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const element = video.current
    return () => { element?.pause() }
  }, [])
  return <div className="terrain-gallery-slide" data-media-state={state}>
    {state === 'loading' && <span className="terrain-gallery-loading" role="status">Loading {item.type}…</span>}
    {state === 'error' ? <p className="terrain-gallery-error" role="status">This media could not load. Try another item or check your connection.</p>
      : item.type === 'video'
        ? <video ref={video} src={item.src} poster={item.poster} aria-label={item.alt} controls playsInline preload="metadata" onLoadedMetadata={() => setState('ready')} onError={() => setState('error')} />
        : <img src={item.src} alt={item.alt} draggable={false} decoding="async" onLoad={() => setState('ready')} onError={() => setState('error')} />}
  </div>
}

export default function ProjectGallery({ project, ready, onActive, onLauncherLayout, openRequest = null }: ProjectGalleryProps) {
  const media = useMemo(() => getProjectMedia(project), [project])
  const [open, setOpen] = useState(false)
  const openState = useRef(false)
  const [index, setIndex] = useState(0)
  const launcher = useRef<HTMLButtonElement>(null)
  const thumbnails = useRef<HTMLDivElement>(null)
  const hovered = useRef(false)
  const handledRequest = useRef<GalleryOpenRequest | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const current = media[index]
  const liveUrl = isMediaSource(project.liveUrl) ? project.liveUrl : undefined
  const changeOpen = (value: boolean) => { openState.current = value; setOpen(value); onActive(value) }
  const move = (offset: number) => setIndex(value => (value + offset + media.length) % media.length)

  useEffect(() => {
    if (!ready || !openRequest || handledRequest.current === openRequest || openRequest.projectSlug !== project.slug) return
    const selected = media.findIndex(item => item.src === openRequest.src)
    if (selected < 0) return
    handledRequest.current = openRequest
    returnFocus.current = openRequest.trigger
    openState.current = true
    setIndex(selected)
    setOpen(true)
    onActive(true)
  }, [openRequest, ready, project.slug, media, onActive])

  useEffect(() => {
    const measure = () => {
      const bounds = launcher.current?.getBoundingClientRect()
      if (!bounds || !ready) { onLauncherLayout(null); return }
      onLauncherLayout({ centerX: bounds.left + bounds.width / 2, centerY: bounds.top + bounds.height / 2,
        size: bounds.width, width: window.innerWidth, height: window.innerHeight, hovered: hovered.current })
    }
    const element = launcher.current
    const enter = () => { hovered.current = true; measure() }
    const leave = () => { hovered.current = false; measure() }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (element) observer?.observe(element)
    window.addEventListener('resize', measure)
    element?.addEventListener('pointerenter', enter); element?.addEventListener('pointerleave', leave)
    element?.addEventListener('focus', enter); element?.addEventListener('blur', leave)
    measure()
    return () => {
      observer?.disconnect(); window.removeEventListener('resize', measure)
      element?.removeEventListener('pointerenter', enter); element?.removeEventListener('pointerleave', leave)
      element?.removeEventListener('focus', enter); element?.removeEventListener('blur', leave)
      onLauncherLayout(null)
    }
  }, [ready, onLauncherLayout, liveUrl])

  useEffect(() => () => onActive(false), [onActive])

  useEffect(() => {
    if (!open || media.length < 2) return
    const images = [media[(index + 1) % media.length], media[(index - 1 + media.length) % media.length]]
    for (const item of images) if (item.type === 'image') { const image = document.createElement('img'); image.decoding = 'async'; image.src = item.src }
    thumbnails.current?.querySelector<HTMLButtonElement>(`[data-media-index="${index}"]`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }, [open, index, media])

  if (!current) return null
  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <div className="terrain-project-actions" role="group" aria-label="Project actions">
      {liveUrl && <a className="terrain-project-action terrain-live-launcher" href={liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit live project: ${project.title} (opens in a new tab)`} title="Visit live project (opens in a new tab)">
        <ExternalLink size={23} aria-hidden="true" /><span className="terrain-gallery-launcher-label">LIVE PROJECT<span>OPEN WEBSITE</span></span>
      </a>}
      <Dialog.Trigger asChild>
        <button ref={launcher} type="button" className="terrain-project-action terrain-gallery-launcher" data-ready={ready} disabled={!ready} onClick={() => { returnFocus.current = null }} aria-label={`Open media gallery for ${project.title}`} title="Open media gallery">
          <Grid2X2 size={23} aria-hidden="true" /><span className="terrain-gallery-launcher-label">EXPLORE THE PROJECT<span>{media.length} {media.length === 1 ? 'ASSET' : 'ASSETS'}</span></span>
        </button>
      </Dialog.Trigger>
    </div>
    <Dialog.Portal>
      <Dialog.Overlay className="terrain-gallery-overlay" />
      <Dialog.Content className="terrain-gallery" onCloseAutoFocus={event => {
        // A previous dialog may finish closing after another preview has opened it again.
        if (openState.current) { event.preventDefault(); return }
        const trigger = returnFocus.current
        returnFocus.current = null
        if (trigger?.isConnected) { event.preventDefault(); trigger.focus({ preventScroll: true }) }
      }} onEscapeKeyDown={event => event.stopPropagation()} onKeyDown={event => {
        if (event.defaultPrevented || (event.target as HTMLElement).closest('video,input,textarea,select')) return
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
        if (event.key === 'Home') { event.preventDefault(); setIndex(0) }
        if (event.key === 'End') { event.preventDefault(); setIndex(media.length - 1) }
      }}>
        <header className="terrain-gallery-header">
          <div><p className="terrain-gallery-eyebrow">A CLOSER LOOK / SELECTED WORK</p><Dialog.Title>{project.title}</Dialog.Title></div>
          <div className="terrain-gallery-tools"><span>{String(index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</span><Dialog.Close className="terrain-gallery-close" aria-label="Close media gallery"><X size={21} aria-hidden="true" /></Dialog.Close></div>
        </header>
        <Dialog.Description className="terrain-gallery-sr-only">Project images and videos. Use the arrow keys or thumbnails to navigate; Escape closes the gallery.</Dialog.Description>
        <div className="terrain-gallery-stage" onPointerDown={event => {
          if (event.pointerType !== 'touch' || (event.target as HTMLElement).closest('video')) return
          swipe.current = { x: event.clientX, y: event.clientY }
        }} onPointerCancel={() => { swipe.current = null }} onPointerUp={event => {
          const start = swipe.current; swipe.current = null
          if (start && Math.abs(event.clientX - start.x) > 60 && Math.abs(event.clientY - start.y) < 60) move(event.clientX < start.x ? 1 : -1)
        }}>
          <GallerySlide key={current.src} item={current} />
        </div>
        <footer className="terrain-gallery-footer">
          <div className="terrain-gallery-caption" aria-live="polite"><span>{current.type === 'video' ? 'MOTION' : 'STILL'} / {String(index + 1).padStart(2, '0')}</span><p>{current.caption || current.alt}</p></div>
          <div className="terrain-gallery-navigation"><button type="button" aria-label="Previous media" disabled={media.length < 2} onClick={() => move(-1)}><ArrowLeft size={20} /></button><button type="button" aria-label="Next media" disabled={media.length < 2} onClick={() => move(1)}><ArrowRight size={20} /></button></div>
        </footer>
        {media.length > 1 && <div ref={thumbnails} className="terrain-gallery-thumbnails" role="group" aria-label="Choose project media">
          {media.map((item, position) => <button type="button" key={item.src} data-media-index={position} aria-label={`View ${item.type} ${position + 1}: ${item.alt}`} aria-pressed={position === index} onClick={() => setIndex(position)}>
            {(item.thumbnail || item.poster || item.type === 'image') && <img src={item.thumbnail || item.poster || item.src} alt="" loading="lazy" decoding="async" />}
            {item.type === 'video' && <Play size={15} aria-hidden="true" />}<span>{String(position + 1).padStart(2, '0')}</span>
          </button>)}
        </div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
