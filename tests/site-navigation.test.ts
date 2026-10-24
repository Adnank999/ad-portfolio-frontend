import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { getSearchResults } from '../src/components/layout/site-search/search-data'
import { projects } from '../src/data/projects'

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

describe('site navigation and global accent', () => {
  test('the temporary loader preview is absent from navigation and routes', () => {
    const navbar = source('components/layout/Navbar.tsx')
    expect(navbar).not.toContain('to="/loading-preview"')
    expect(existsSync(new URL('../src/routes/loading-preview.tsx', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../src/components/feedback/LoadingPreview.tsx', import.meta.url))).toBe(false)
  })

  test('search trims queries, ignores case and includes project names and descriptions', () => {
    expect(getSearchResults('  ABOUT  ')).toEqual(getSearchResults('about'))
    expect(getSearchResults('story behind the code').some(item => item.href === '/about')).toBe(true)
    for (const project of projects) expect(getSearchResults(project.title).some(item => item.href === `/projects/${project.slug}`)).toBe(true)
    expect(getSearchResults('not-a-real-page-987654')).toEqual([])
    expect(getSearchResults('  ')).toHaveLength(projects.length + 6)
  })

  test('keeps Method and Tools hidden and account actions beside the contact action', () => {
    const navbar = source('components/layout/Navbar.tsx')
    expect(navbar).not.toContain('Method')
    expect(navbar).not.toContain('dropdownButton("tools")')
    expect(navbar).not.toContain('label="Tools"')
    expect(navbar.indexOf('<SignInButton')).toBeLessThan(navbar.indexOf('</header>'))
    expect(navbar.lastIndexOf('<SignInButton')).toBeGreaterThan(navbar.indexOf('</header>'))
    expect(navbar).toContain('portfolio-nav-desktop-account')
    expect(navbar).toContain('<WhatsAppIcon />')
    expect(navbar).not.toContain('message us')
    expect(navbar).toContain('Let’s talk')
    expect(source('components/layout/sign-in-button/SignInButton.tsx')).toContain('to="/login"')
    const account = source('components/layout/sign-in-button/SignInButton.tsx')
    expect(account).toContain('useQuery(meOptions())')
    expect(account).toContain('account.name')
    expect(account).toContain('logout.mutateAsync()')
  })

  test('keeps sign-in compact and rectangular with an inset position and an accessible target', () => {
    const styles = source('components/layout/sign-in-button/sign-in-button.css')
    expect(styles).toContain('right: clamp(32px, 4vw, 72px);')
    expect(styles).toContain('min-height: 44px;')
    expect(styles).toContain('padding: 8px 14px;')
    expect(styles).toContain('border-radius: 0;')
    expect(styles).not.toContain('border-radius: 18px 6px 18px 6px;')
    expect(styles).toContain('.site-sign-in:focus-visible')
    expect(styles).toContain('prefers-reduced-motion')
  })

  test('uses a portaled accessible dialog with full-screen frost and one shared crimson accent', () => {
    const search = source('components/layout/site-search/SiteSearch.tsx')
    expect(search).toContain('<Dialog.Portal>')
    expect(search).toContain('<Dialog.Title>')
    expect(search).toContain('<Dialog.Description')
    expect(search).toContain('onCloseAutoFocus')
    expect(search).toContain('data-lenis-prevent')
    const styles = source('components/layout/site-search/site-search.css')
    expect(styles).toContain('position: fixed; inset: 0;')
    expect(styles).toContain('backdrop-filter: blur(16px)')
    expect(styles).toContain('prefers-reduced-motion')
    expect(source('styles/app.css')).toContain('--color-accent: #C21E56;')
    expect(source('styles/app.css')).toContain('--accent-rgb: 194 30 86;')
    expect(source('components/layout/Navbar.tsx')).toContain('glowColor="#C21E56"')
    for (const path of ['styles/homepage.css', 'styles/navbar.css']) expect(source(path)).toContain(': var(--accent);')
  })

  test('keeps navigation sign-in glossy glass while auth page buttons retain the two-red gradient', () => {
    const navigationStyles = source('components/layout/sign-in-button/sign-in-button.css')
    expect(navigationStyles).toContain('background: linear-gradient(135deg, rgb(255 255 255 / 15%), rgb(255 255 255 / 3%)), rgb(17 19 25 / 65%);')
    expect(navigationStyles).toContain('backdrop-filter: blur(20px);')
    expect(navigationStyles).toContain('.site-sign-in::before')
    expect(navigationStyles).not.toContain('background: var(--accent-text-gradient);')
    expect(source('components/admin/admin.css')).toContain('.auth-shell .bg-accent-500 { background-image: var(--accent-text-gradient);')
  })

  test('clips the two-color gradient to text without clipping badge surfaces or SVG icons', () => {
    const styles = source('styles/app.css')
    expect(styles).toContain('--accent-text-end: #7C0A02;')
    expect(styles).toContain('--accent-text-gradient: linear-gradient(110deg, var(--accent), var(--accent-text-end));')
    expect(styles).toContain('@utility text-accent-*')
    expect(styles).toContain('@utility text-white')
    expect(styles).toContain('background-image: var(--accent-text-paint, none)')
    expect(styles).toContain('forced-colors: active')
    expect(styles).not.toContain('border-image:')
    expect(source('components/blog/blog-detail/BlogDetailPage.tsx')).toContain('<span className="accent-text">{post.author.initials}</span>')
    expect(source('components/layout/site-search/SiteSearch.tsx')).toContain('<span className="accent-text">{item.label}</span><small>')
  })
})
