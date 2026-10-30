import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Project } from '@/data/projects'
import { useQuery } from '@tanstack/react-query'
import { projectsOptions } from '@/queries/projects/projects'
import { useSectionProgress } from './hooks/useCinematicMotion'
import { SectionLabel } from './cinematic/SectionLabel'
import { useSmoothScroll } from '@/components/layout/SmoothScrollProvider'


function CinematicProjectCard({ project, index, still, onFocus }: { project: Project; index: number; still: boolean; onFocus: () => void }) {
  const cardRef = useRef<HTMLElement>(null)
  const progress = useSectionProgress(cardRef)
  const imageScale = useTransform(progress, [0, 1], [1.08, 1])
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateX = useSpring(pointerY, { stiffness: 160, damping: 24 })
  const rotateY = useSpring(pointerX, { stiffness: 160, damping: 24 })
  const [imageFailed, setImageFailed] = useState(false)
  return <motion.article ref={cardRef} className="cinema-project-card" style={still ? undefined : { rotateX, rotateY, transformPerspective: 1000 }} onPointerMove={event => {
    if (still || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 5)
    pointerY.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 5)
  }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0) }}>
    <Link to="/projects/$slug" params={{ slug: project.slug }} className="cinema-project-link" onFocus={onFocus}>
      <div className={`cinema-project-image cinema-project-image-${index}`}>
        {!imageFailed && <motion.img src={project.thumbnailUrl || project.image} alt="" loading="lazy" decoding="async" width={1200} height={900} onError={() => setImageFailed(true)} style={still ? undefined : { scale: imageScale }} />}
        <span className="cinema-project-category">{project.category}</span><span className="cinema-project-arrow"><ArrowUpRight size={27} aria-hidden="true" /></span><span className="cinema-project-image-title" aria-hidden="true">{index === 0 ? 'A world\nof possibilities.' : index === 1 ? 'Clarity,\nat a glance.' : index === 2 ? 'Made for\ndiscovery.' : 'See things\ndifferently.'}</span>
      </div>
      <div className="cinema-project-meta"><div><span className="cinema-micro">0{index + 1} / {project.year}</span><h3>{project.title}</h3><p>{project.technologies.slice(0, 3).join(' / ')}</p></div><ArrowUpRight size={22} aria-hidden="true" /></div>
    </Link>
  </motion.article>
}

export function CinematicProjects({ compact, still }: { compact: boolean; still: boolean }) {
  const projects = useQuery(projectsOptions())
  const selectedProjects = projects.isError ? [] : (projects.data ?? []).slice(0, 4)
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const distance = useMotionValue(0)
  const progress = useSectionProgress(sectionRef, true)
  const x = useTransform(() => -progress.get() * distance.get())
  const lenis = useSmoothScroll()
  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const measure = () => distance.set(Math.max(0, track.scrollWidth - viewport.clientWidth))
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(track)
    measure()
    return () => observer.disconnect()
  }, [distance, compact, still, selectedProjects.length])
  const move = (direction: number) => {
    const section = sectionRef.current
    if (!section) return
    const next = Math.max(0, Math.min(1, progress.get() + direction / Math.max(1, selectedProjects.length - 1)))
    const target = section.getBoundingClientRect().top + window.scrollY + next * (section.offsetHeight - window.innerHeight)
    if (lenis.current) lenis.current.scrollTo(target)
    else window.scrollTo({ top: target, behavior: 'instant' })
  }
  const revealFocusedProject = (index: number) => {
    const section = sectionRef.current
    const card = trackRef.current?.children[index] as HTMLElement | undefined
    const firstCard = trackRef.current?.children[0] as HTMLElement | undefined
    if (compact || still || !section || !card || !firstCard || !distance.get()) return
    const fraction = Math.min(1, (card.offsetLeft - firstCard.offsetLeft) / distance.get())
    const target = section.getBoundingClientRect().top + window.scrollY + fraction * (section.offsetHeight - window.innerHeight)
    if (lenis.current) lenis.current.scrollTo(target, { immediate: true })
    else window.scrollTo({ top: target, behavior: 'instant' })
    if (viewportRef.current) viewportRef.current.scrollLeft = 0
  }
  if (!selectedProjects.length) return null
  return <section ref={sectionRef} id="creations" className="cinema-section cinema-light cinema-work" aria-labelledby="work-title"><div className="cinema-sticky cinema-work-sticky"><div className="cinema-wrap cinema-work-heading"><div><SectionLabel number="03">Selected work</SectionLabel><h2 id="work-title">Ideas out in the world.</h2></div><Link to="/projects" className="cinema-link"><span className="accent-text">All projects </span><ArrowUpRight size={20} aria-hidden="true" /></Link></div>
    <div ref={viewportRef} className="cinema-project-viewport"><motion.div ref={trackRef} className="cinema-project-track" style={compact || still ? undefined : { x }}>{selectedProjects.map((project, index) => <CinematicProjectCard key={project.id} project={project} index={index} still={still} onFocus={() => revealFocusedProject(index)} />)}</motion.div></div>
    <div className="cinema-wrap cinema-work-bottom"><span className="cinema-micro">Thoughtful design. Solid foundations. Real possibilities.</span>{!compact && !still && <div className="cinema-work-controls"><button type="button" aria-label="Previous project" onClick={() => move(-1)}><ArrowLeft size={20} /></button><button type="button" aria-label="Next project" onClick={() => move(1)}><ArrowRight size={20} /></button></div>}</div>
  </div></section>
}
