import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react'
import { contactEmail } from '../contact-page/contact-channels'
import './site-footer.css'

export function SiteFooter({ showContactPrompt = true }: { showContactPrompt?: boolean }) {
  return <footer className="site-footer" aria-label="Site footer" data-contact-prompt={showContactPrompt}><div className="site-footer-wrap">
    {showContactPrompt && <div className="site-footer-top"><div><p className="site-footer-eyebrow">A good place to start</p><h2>Have something<br />in mind?</h2></div><Link to="/contact" className="site-footer-cta">Let’s talk about it <ArrowUpRight size={22} aria-hidden="true" /></Link></div>}
    <div className="site-footer-middle"><Link to="/" className="site-footer-brand"><img src="/logo.svg" width={36} height={46} alt="" loading="lazy" /><span>Adnan Hossain Khan<small>Thoughtful systems. Remarkable experiences.</small></span></Link>
      <nav aria-label="Footer navigation"><Link to="/services">Services</Link><Link to="/projects">Work</Link><Link to="/case-studies">Case studies</Link><Link to="/about">About</Link><Link to="/blog">Insights</Link><Link to="/contact">Contact</Link></nav>
    </div>
    <div className="site-footer-bottom"><p>© {new Date().getFullYear()} Adnan Hossain Khan</p><p>Built with intention. Made to evolve.</p><div><a href="https://github.com/Adnank999" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18} aria-hidden="true" /></a><a href="https://www.linkedin.com/in/adnan-khan-9292971a6/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} aria-hidden="true" /></a>{contactEmail && <a href={`mailto:${contactEmail}`} aria-label="Email Adnan"><Mail size={18} aria-hidden="true" /></a>}</div></div>
  </div></footer>
}
