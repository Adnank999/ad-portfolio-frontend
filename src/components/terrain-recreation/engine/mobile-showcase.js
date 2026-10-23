export function getMobileCameraScale(width, height) {
  if (width > 760 || width <= 0 || height <= 0) return 1;
  return Math.min(1.5, Math.max(1.1, height / width * .75));
}

export function getAdjacentProjectIndex(index, direction, count) {
  if (count <= 0) return -1;
  return ((index + direction) % count + count) % count;
}

export function createMobileProjectNavigation(host, onStep) {
  const navigation = document.createElement('nav');
  navigation.className = 'project-mobile-navigation';
  navigation.setAttribute('aria-label', 'Browse projects');
  const makeButton = (direction, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${direction < 0 ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}"/></svg><span>${label}</span>`;
    button.addEventListener('click', event => { event.stopPropagation(); onStep(direction); });
    return button;
  };
  const previous = makeButton(-1, 'Previous');
  const next = makeButton(1, 'Next');
  const status = document.createElement('span');
  status.className = 'project-mobile-position';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  navigation.append(previous, status, next);
  host.append(navigation);
  return {
    update(index, projects) {
      const count = projects.length;
      previous.disabled = next.disabled = count < 2;
      previous.setAttribute('aria-label', `Previous project: ${projects[getAdjacentProjectIndex(index, -1, count)]?.title || ''}`);
      next.setAttribute('aria-label', `Next project: ${projects[getAdjacentProjectIndex(index, 1, count)]?.title || ''}`);
      status.textContent = `${index + 1} / ${count}`;
      status.setAttribute('aria-label', `${projects[index]?.title || 'Project'}, ${index + 1} of ${count}`);
    },
    destroy() { navigation.remove(); },
  };
}
