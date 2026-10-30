import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { projects, type Project } from '../src/data/projects'
import ProjectGallery from '../src/components/terrain-recreation/gallery/ProjectGallery'
import { getProjectMedia } from '../src/components/terrain-recreation/gallery/project-media'

afterEach(cleanup)

const project: Project = {
  ...projects[0], image: '/media/cover.webp',
  media: [
    { type: 'image', src: '/media/detail.webp', alt: 'Booking interface', caption: 'A closer look at booking' },
    { type: 'video', src: '/media/walkthrough.mp4', alt: 'Booking walkthrough', poster: '/media/poster.webp' },
  ],
}

describe('project media gallery', () => {
  test('opens the requested image, restores preview focus and can reopen the same selection', async () => {
    const preview = document.createElement('button')
    document.body.append(preview)
    const onActive = mock((_active: boolean) => {})
    const onLauncherLayout = () => {}
    const view = render(<ProjectGallery project={project} ready onActive={onActive} onLauncherLayout={onLauncherLayout} />)
    const openPreview = () => view.rerender(<ProjectGallery project={project} ready onActive={onActive} onLauncherLayout={onLauncherLayout} openRequest={{ projectSlug: project.slug, src: '/media/detail.webp', trigger: preview }} />)
    for (let attempt = 0; attempt < 2; attempt++) {
      openPreview()
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByAltText('Booking interface').getAttribute('src')).toBe('/media/detail.webp')
      expect(within(dialog).getByRole('button', { name: /View image 2/ }).getAttribute('aria-pressed')).toBe('true')
      expect(onActive).toHaveBeenLastCalledWith(true)
      fireEvent.click(within(dialog).getByRole('button', { name: 'Next media' }))
      expect(dialog.querySelector('video')).not.toBeNull()
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close media gallery' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(onActive).toHaveBeenLastCalledWith(false)
      await waitFor(() => expect(document.activeElement).toBe(preview))
    }
    view.rerender(<ProjectGallery project={project} ready onActive={onActive} onLauncherLayout={onLauncherLayout} openRequest={{ projectSlug: 'another-project', src: '/media/detail.webp', trigger: preview }} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    view.rerender(<ProjectGallery project={project} ready onActive={onActive} onLauncherLayout={onLauncherLayout} openRequest={{ projectSlug: project.slug, src: '/unrelated.webp', trigger: preview }} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    preview.remove()
  })

  test('keeps the live website beside the gallery with a safe, accessible external link', () => {
    const view = render(<ProjectGallery project={{ ...project, liveUrl: 'https://example.com/booking' }} ready onActive={() => {}} onLauncherLayout={() => {}} />)
    const actions = screen.getByRole('group', { name: 'Project actions' })
    const live = within(actions).getByRole('link', { name: `Visit live project: ${project.title} (opens in a new tab)` })
    expect(live.getAttribute('href')).toBe('https://example.com/booking')
    expect(live.getAttribute('target')).toBe('_blank')
    expect(live.getAttribute('rel')).toBe('noopener noreferrer')
    expect(within(actions).getByRole('button', { name: /open media gallery/i })).toBeDefined()
    view.rerender(<ProjectGallery project={{ ...project, liveUrl: 'javascript:alert(1)' }} ready onActive={() => {}} onLauncherLayout={() => {}} />)
    expect(within(actions).queryByRole('link')).toBeNull()
  })

  test('uses all real project media, removes duplicates and rejects unsafe URLs', () => {
    expect(getProjectMedia(project).map(item => item.type)).toEqual(['image', 'image', 'video'])
    const media = getProjectMedia({ ...project, media: [
      ...project.media!,
      { type: 'image', src: project.image, alt: 'Duplicate' },
      { type: 'image', src: 'javascript:alert(1)', alt: 'Unsafe' },
      { type: 'video', src: '//unexpected.test/video.mp4', alt: 'Protocol-relative URL' },
      { type: 'video', src: '/media/safe.mp4', alt: 'Safe video', poster: 'javascript:alert(1)', thumbnail: 'data:text/html,unsafe' },
    ] })
    expect(media).toHaveLength(4)
    expect(media.at(-1)?.poster).toBeUndefined()
    expect(media.at(-1)?.thumbnail).toBeUndefined()
    expect(getProjectMedia(projects[0])).toHaveLength(1)
  })

  test('opens a focused dialog, navigates images/video and closes without leaving the project', async () => {
    const onActive = mock((_active: boolean) => {})
    const onLauncherLayout = mock(() => {})
    const href = window.location.href
    render(<ProjectGallery project={project} ready onActive={onActive} onLauncherLayout={onLauncherLayout} />)
    const trigger = screen.getByRole('button', { name: /open media gallery/i })
    fireEvent.click(trigger)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: project.title })).toBeDefined()
    expect(within(dialog).getByAltText(`${project.title} project preview`).getAttribute('src')).toBe(project.image)
    expect(onActive).toHaveBeenLastCalledWith(true)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Next media' }))
    expect(within(dialog).getByAltText('Booking interface').getAttribute('src')).toBe('/media/detail.webp')
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    const video = dialog.querySelector('video')!
    expect(video.getAttribute('src')).toBe('/media/walkthrough.mp4')
    expect(video.hasAttribute('controls')).toBe(true)
    expect(video.getAttribute('preload')).toBe('metadata')
    expect(video.hasAttribute('autoplay')).toBe(false)
    fireEvent.keyDown(dialog, { key: 'Home' })
    expect(dialog.querySelector('video')).toBeNull()
    expect(within(dialog).getByRole('button', { name: /View image 1/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.keyDown(dialog, { key: 'End' })
    expect(dialog.querySelector('video')).not.toBeNull()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close media gallery' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(onActive).toHaveBeenLastCalledWith(false)
    expect(window.location.href).toBe(href)
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  test('stops engine modal mode on route unmount and disables navigation for one asset', async () => {
    const onActive = mock((_active: boolean) => {})
    const view = render(<ProjectGallery project={projects[0]} ready onActive={onActive} onLauncherLayout={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /open media gallery/i }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole<HTMLButtonElement>('button', { name: 'Next media' }).disabled).toBe(true)
    expect(dialog.querySelector('.terrain-gallery-thumbnails')).toBeNull()
    view.unmount()
    expect(onActive).toHaveBeenLastCalledWith(false)
  })
})
