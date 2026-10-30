import { createProjectCatalog, projectPath, normalizeBase } from './projects.js';
import { getProjectMedia } from '../gallery/project-media';

export function getImageScrollReveal(rectangle, height, reducedMotion = false) {
  if (reducedMotion) return 1;
  const clamp = value => Math.max(0, Math.min(1, value));
  const entering = clamp((height * .94 - rectangle.top) / Math.max(1, Math.min(rectangle.height * .65, height * .4)));
  const leaving = clamp((rectangle.top + rectangle.height - height * .04) / Math.max(1, Math.min(rectangle.height * .4, height * .24)));
  return Math.min(entering, leaving);
}

export function createProjectPage({ host, pass, getArtwork, loadArtwork, noise, imageBase, projects = [], base = '/', reducedMotion = false,
  onProject = () => {}, onActive = () => {}, onImageHover = () => {}, onNavigate = null, eventTarget = window, documentTarget = document }) {
  const catalog = createProjectCatalog(projects);
  const { getProject, getNextProject, projectFromPath } = catalog;
  const root = documentTarget.createElement('article');
  root.className = 'showcase-page'; root.hidden = true; root.tabIndex = -1;
  root.setAttribute('aria-label', 'Project showcase');
  host.appendChild(root);
  const originalTitle = documentTarget.title, session = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const overviewPath = normalizeBase(base);
  let current = null, observer = null, previousFocus = null, pendingFocus = null, destroyed = false, phase = 'closed';
  let hero = null, nextArt = null, mediaArt = null, progressBar = null, depth = 0, returning = false;
  let hostBounds = null, pointerImage = null, focusImage = null, lastAmount = -1;
  let smallImages = [];
  let artworkRequest = 0;
  const pauseVideos = () => root.querySelectorAll('video').forEach(video => video.pause());
  if (!onNavigate) eventTarget.history.replaceState({ ...eventTarget.history.state, terrainShowcase: {
    session, depth: 0, overview: !projectFromPath(eventTarget.location.pathname, base),
  } }, '');

  function measure() {
    if (root.hidden || !hero || !nextArt) return;
    hostBounds = host.getBoundingClientRect();
    const relativeBounds = element => {
      const rectangle = element.getBoundingClientRect();
      return { left: rectangle.left - hostBounds.left, top: rectangle.top - hostBounds.top, width: rectangle.width, height: rectangle.height };
    };
    pass.setLayout(relativeBounds(hero), relativeBounds(nextArt), Math.max(1, hostBounds.width), Math.max(1, hostBounds.height), relativeBounds(mediaArt));
    for (const [slot, element] of [['hero', hero], ['next', nextArt]]) {
      pass.setImageVisibility(slot, slot === 'hero' && element.dataset.renderMode === 'native' ? 0 : getImageScrollReveal(relativeBounds(element), hostBounds.height, reducedMotion));
    }
    pass.setMediaLayout(smallImages.map(({ id, element }) => {
      const rectangle = relativeBounds(element);
      const progress = getImageScrollReveal(rectangle, hostBounds.height, reducedMotion);
      element.style.setProperty('--image-reveal', progress);
      return { id, rectangle, progress, hovered: pointerImage === id || focusImage === id };
    }), Math.max(1, hostBounds.width), Math.max(1, hostBounds.height));
    const scrollable = root.scrollHeight - root.clientHeight;
    progressBar.style.transform = `scaleY(${scrollable > 0 ? root.scrollTop / scrollable : 0})`;
  }

  function renderProject(project) {
    observer?.disconnect();
    pauseVideos(); smallImages = [];
    pointerImage = focusImage = null; pass.resetImages();
    const next = getNextProject(project.id);
    root.setAttribute('aria-label', `${project.title} project showcase`);
    root.innerHTML = `
      <figure class="case-art" data-image-effect="hero" data-render-mode="${loadArtwork ? 'native' : 'webgl'}"><img class="case-hero-image" alt="" decoding="async" fetchpriority="high"></figure>
      <div class="case-content">
        <section class="case-intro" aria-labelledby="case-title">
          <div class="case-heading case-reveal"><p class="case-eyebrow">PROJECT SHOWCASE</p><h1 id="case-title" tabindex="-1"></h1></div>
          <div class="case-description case-reveal"><p class="case-lead"></p>
            <dl class="case-facts"><div><dt>YEAR</dt><dd class="case-year"></dd><dt>CATEGORY</dt><dd class="case-client"></dd></div>
              <div class="case-stack"><dt>TECHNOLOGIES</dt></div></dl><div class="case-project-links"></div>
          </div>
        </section>
        <section class="case-story case-reveal" aria-labelledby="case-story-title"><h2 id="case-story-title">Built for<br>the real world.</h2><p class="case-summary"></p></section>
        <section class="case-services" aria-label="Creative approach"></section>
        <div class="case-media-list"></div>
        <section class="case-features-section case-reveal" aria-label="Key features"><h2>Key features</h2><ul class="case-features"></ul></section>
        <a class="case-next" data-action="next" data-image-effect="next" href=""><span class="case-next-art"><img class="case-next-image" alt="" loading="lazy" decoding="async"></span><span class="case-eyebrow">NEXT PROJECT</span><span class="case-next-title"></span><span class="case-next-arrow" aria-hidden="true">↗</span></a>
        <a class="case-back" data-action="overview" href="${overviewPath}"><span aria-hidden="true">←</span> TO OVERVIEW</a>
        <footer class="case-footer">ADNAN / SELECTED WORK <span>END OF TRANSMISSION</span></footer>
      </div>
      <div class="case-scroll-track" aria-hidden="true"><span></span></div>`;
    root.querySelector('#case-title').textContent = project.title;
    root.querySelector('.case-lead').textContent = project.description;
    root.querySelector('.case-client').textContent = project.client;
    root.querySelector('.case-year').textContent = project.year;
    root.querySelector('.case-summary').textContent = project.summary;
    for (const technology of project.technologies) {
      const item = documentTarget.createElement('dd'); item.textContent = technology;
      root.querySelector('.case-stack').append(item);
    }
    for (const feature of project.features) {
      const item = documentTarget.createElement('li'); item.textContent = feature;
      root.querySelector('.case-features').append(item);
    }
    for (const [label, href] of [['Live project', project.liveUrl], ['Source code', project.githubUrl]]) {
      if (!href || !/^(https?:\/\/|\/(?!\/))/.test(href)) continue;
      const link = documentTarget.createElement('a'); link.textContent = label; link.href = href;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; root.querySelector('.case-project-links').append(link);
    }
    const services = root.querySelector('.case-services');
    for (const [title, description] of project.services) {
      const section = documentTarget.createElement('section'); section.className = 'case-service case-reveal';
      const heading = documentTarget.createElement('h3'), text = documentTarget.createElement('p');
      heading.textContent = title; text.textContent = description; section.append(heading, text); services.append(section);
    }
    const artwork = getArtwork(project.id, project.heroImageUrl).image;
    const artworkWidth = artwork.naturalWidth || artwork.width, artworkHeight = artwork.naturalHeight || artwork.height;
    const artworkAspect = artworkWidth / artworkHeight;
    const prepareImage = (image, item) => {
      image.width = artworkWidth; image.height = artworkHeight; image.alt = item.alt;
      image.addEventListener('load', () => {
        if (!root.contains(image)) return;
        const slot = image.closest('[data-image-effect]')?.dataset.imageEffect;
        if (slot?.startsWith('media:') && !image.dataset.nativeOnly) {
          pass.setMediaImage(slot, image);
          image.parentElement.dataset.artworkReady = 'true';
        }
        measure();
      });
      image.addEventListener('error', () => {
        if (image.crossOrigin && !image.dataset.nativeOnly) {
          image.dataset.nativeOnly = 'true'; image.removeAttribute('crossorigin'); image.src = item.src;
          if (image.closest('[data-image-effect]')?.dataset.imageEffect === 'hero') {
            image.closest('.case-art').dataset.renderMode = 'native'; measure();
          }
          return;
        }
        if (image.dataset.fallback) return;
        image.dataset.fallback = 'true'; image.src = imageBase + 'terrain-diffuse.webp';
      });
      image.src = item.src;
    };
    const heroImage = root.querySelector('.case-hero-image');
    heroImage.crossOrigin = 'anonymous';
    prepareImage(heroImage, { src: project.heroImageUrl || project.imageUrl, alt: project.heroImageAlt || `${project.title} project preview` });
    const images = getProjectMedia(project);
    for (const [index, item] of images.entries()) {
      const figure = documentTarget.createElement('figure'); figure.className = 'case-media';
      const small = item.type === 'image' && item.layout === 'small';
      figure.dataset.layout = small ? 'small' : 'large';
      const frame = documentTarget.createElement('div'); frame.className = 'case-media-art';
      if (small) {
        frame.dataset.imageEffect = `media:${index}`;
        smallImages.push({ id: frame.dataset.imageEffect, element: frame });
      }
      if (item.type === 'video') {
        const video = documentTarget.createElement('video'); video.className = 'case-video';
        video.controls = true; video.playsInline = true; video.preload = 'metadata';
        video.src = item.src; video.setAttribute('aria-label', item.alt);
        video.addEventListener('loadedmetadata', measure);
        if (item.poster) video.poster = item.poster;
        frame.append(video);
      } else {
        const image = documentTarget.createElement('img'); image.className = 'case-image';
        image.loading = 'lazy'; image.decoding = 'async';
        if (small) image.crossOrigin = 'anonymous';
        prepareImage(image, item); frame.append(image);
      }
      const caption = documentTarget.createElement('figcaption'), label = documentTarget.createElement('span'), text = documentTarget.createElement('p');
      label.textContent = `SELECTED DETAIL / ${String(index + 1).padStart(2, '0')}`; text.textContent = item.caption || item.alt;
      caption.append(label, text); figure.append(frame, caption); root.querySelector('.case-media-list').append(figure);
    }
    const nextLink = root.querySelector('.case-next'); nextLink.href = projectPath(next.id, base);
    nextLink.hidden = next.id === project.id;
    nextLink.setAttribute('aria-label', `Next project: ${next.title}`);
    nextLink.querySelector('.case-next-title').textContent = next.title;
    hero = root.querySelector('.case-art'); nextArt = root.querySelector('.case-next-art');
    const nextImage = root.querySelector('.case-next-image'); nextImage.crossOrigin = 'anonymous';
    prepareImage(nextImage, { src: next.imageUrl, alt: `${next.title} project preview` });
    hero.style.setProperty('--case-art-aspect', String(artworkAspect));
    mediaArt = root.querySelector('.case-image') || hero;
    progressBar = root.querySelector('.case-scroll-track span');
    if (typeof IntersectionObserver !== 'undefined' && !reducedMotion) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          if (entry.target.dataset.imageEffect) pass.revealImage(entry.target.dataset.imageEffect);
          observer.unobserve(entry.target);
        }
      }, { root, threshold: .08 });
      root.querySelectorAll('.case-reveal').forEach(section => observer.observe(section));
    } else root.querySelectorAll('.case-reveal').forEach(section => {
      section.classList.add('is-in-view');
      if (section.dataset.imageEffect) pass.revealImage(section.dataset.imageEffect);
    });
    root.scrollTop = 0; measure();
  }

  function open(id, { historyMode = 'push' } = {}) {
    const project = getProject(id);
    if (destroyed || !project) return false;
    if (onNavigate && historyMode === 'push') { onNavigate(project.id); return true; }
    const wasActive = pass.transition.getState().active;
    pendingFocus = null;
    if (!wasActive) previousFocus = documentTarget.activeElement;
    if (historyMode === 'push' && projectFromPath(eventTarget.location.pathname, base)?.id !== id) {
      const state = eventTarget.history.state?.terrainShowcase;
      depth = state?.session === session ? state.depth + 1 : 1;
      eventTarget.history.pushState({ ...eventTarget.history.state, terrainShowcase: {
        session, depth, overview: state?.session === session && state.overview,
      } }, '', projectPath(id, base));
    }
    const changed = current?.id !== id;
    current = project; root.hidden = false; root.inert = false;
    host.classList.add('is-showcasing');
    onActive(true); onProject(id);
    const next = getNextProject(id);
    pass.setProject(id, getArtwork(id, project.heroImageUrl), getArtwork(next.id), noise, { current: project.artworkCrop, next: next.artworkCrop });
    pass.transition.open();
    if (changed || !wasActive) renderProject(project);
    const request = ++artworkRequest;
    const showNativeHero = () => {
      if (destroyed || request !== artworkRequest || current?.id !== id || !hero) return;
      hero.dataset.renderMode = 'native'; measure();
    };
    if (loadArtwork) void loadArtwork(id, project.heroImageUrl || project.imageUrl).then(texture => {
      if (destroyed || request !== artworkRequest || current?.id !== id) return;
      if (!texture) { showNativeHero(); return; }
      pass.setProject(id, texture, getArtwork(next.id), noise, { current: project.artworkCrop, next: next.artworkCrop });
      hero.dataset.renderMode = 'webgl';
      const image = texture.image;
      if (hero && image?.width && image?.height) hero.style.setProperty('--case-art-aspect', String(image.width / image.height));
      measure();
    }).catch(showNativeHero);
    root.dataset.phase = 'opening';
    phase = 'opening'; if (!onNavigate) documentTarget.title = `${project.title} — Adnan Hossain Khan`;
    if (wasActive && changed) root.querySelector('#case-title')?.focus({ preventScroll: true });
    return true;
  }

  function close() {
    artworkRequest++;
    if (destroyed || !pass.transition.getState().active) return;
    root.inert = true; root.dataset.phase = 'closing';
    pauseVideos();
    pointerImage = focusImage = null; updateImageHover();
    pass.transition.close(); phase = 'closing'; if (!onNavigate) documentTarget.title = originalTitle;
  }

  function overview() {
    if (destroyed || returning) return;
    if (onNavigate) { onNavigate(null); return; }
    const state = eventTarget.history.state?.terrainShowcase;
    if (state?.session === session && state.overview && state.depth > 0) { returning = true; eventTarget.history.go(-state.depth); }
    else {
      eventTarget.history.replaceState({ ...eventTarget.history.state, terrainShowcase: { session, depth: 0, overview: true } }, '', overviewPath);
      depth = 0; close();
    }
  }

  function onPop() {
    returning = false;
    const project = projectFromPath(eventTarget.location.pathname, base);
    const state = eventTarget.history.state?.terrainShowcase;
    depth = state?.session === session ? state.depth : 0;
    if (project) open(project.id, { historyMode: 'none' }); else close();
  }
  function onKey(event) {
    if (!root.inert && !event.defaultPrevented && event.key === 'Escape' && !event.repeat && pass.transition.getState().active) { event.preventDefault(); overview(); }
  }
  function onClick(event) {
    const link = event.target.closest('a[data-action]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.dataset.action === 'overview') overview(); else open(getNextProject(current.id).id);
  }
  function onPointer(event) {
    if (reducedMotion) return;
    const bounds = hostBounds;
    if (!bounds) return;
    pass.pointer.set((event.clientX - bounds.left) / bounds.width - .5, .5 - (event.clientY - bounds.top) / bounds.height);
  }
  function updateImageHover() {
    for (const slot of ['hero', 'media', 'next']) pass.hoverImage(slot, pointerImage === slot || focusImage === slot);
    measure();
  }
  function onImageEnter(event) {
    if (event.pointerType === 'touch' || root.inert) return;
    const image = event.target.closest('[data-image-effect]');
    if (!image || image.contains(event.relatedTarget)) return;
    const slot = image.dataset.imageEffect;
    const wasActive = pointerImage === slot || focusImage === slot;
    if (event.type === 'focusin') focusImage = slot; else pointerImage = slot;
    updateImageHover();
    if (!wasActive) onImageHover(slot);
  }
  function onImageLeave(event) {
    const image = event.target.closest('[data-image-effect]');
    if (!image || image.contains(event.relatedTarget)) return;
    if (event.type === 'focusout') focusImage = null; else pointerImage = null;
    updateImageHover();
  }
  const onPointerLeave = () => { pass.pointer.set(0, 0); pointerImage = null; updateImageHover(); };
  root.addEventListener('scroll', measure, { passive: true }); root.addEventListener('click', onClick);
  root.addEventListener('pointermove', onPointer, { passive: true }); root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('pointerover', onImageEnter); root.addEventListener('pointerout', onImageLeave);
  root.addEventListener('focusin', onImageEnter); root.addEventListener('focusout', onImageLeave);
  if (!onNavigate) eventTarget.addEventListener('popstate', onPop);
  eventTarget.addEventListener('keydown', onKey);

  return {
    open, overview, resize: measure,
    setModalActive(value) { root.inert = Boolean(value); if (value) pauseVideos(); },
    syncRoute(id, project) { if (project) { catalog.updateProject(project); if (current?.id === id) current = null; } if (id) open(id, { historyMode: 'none' }); else close(); },
    restore() { const project = projectFromPath(eventTarget.location.pathname, base); if (project) open(project.id, { historyMode: 'none' }); },
    update(state) {
      if (lastAmount !== state.amount) {
        root.style.setProperty('--case-content-opacity', Math.min(1, Math.max(0, (state.amount - .15) / .65)));
        lastAmount = state.amount;
      }
      if (pendingFocus?.isConnected && documentTarget.defaultView.getComputedStyle(pendingFocus).visibility === 'visible') {
        pendingFocus.focus({ preventScroll: true }); pendingFocus = null;
      }
      if (state.phase === phase) return;
      phase = state.phase; root.dataset.phase = phase;
      if (phase === 'open') { root.querySelector('#case-title')?.focus({ preventScroll: true }); measure(); }
      if (phase === 'closed') {
        root.hidden = true; root.inert = false; host.classList.remove('is-showcasing');
        observer?.disconnect(); onActive(false);
        if (previousFocus?.isConnected) {
          previousFocus.focus({ preventScroll: true });
          if (documentTarget.activeElement !== previousFocus) pendingFocus = previousFocus;
        }
      }
    },
    getState: () => ({ ...pass.transition.getState(), project: current?.id || null, depth, scrollTop: root.scrollTop }),
    dispose() {
      artworkRequest++;
      if (destroyed) return;
      destroyed = true; observer?.disconnect(); pauseVideos();
      eventTarget.removeEventListener('popstate', onPop); eventTarget.removeEventListener('keydown', onKey);
      root.removeEventListener('scroll', measure); root.removeEventListener('click', onClick);
      root.removeEventListener('pointermove', onPointer); root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointerover', onImageEnter); root.removeEventListener('pointerout', onImageLeave);
      root.removeEventListener('focusin', onImageEnter); root.removeEventListener('focusout', onImageLeave);
      root.remove(); host.classList.remove('is-showcasing'); if (!onNavigate) documentTarget.title = originalTitle;
    },
  };
}
