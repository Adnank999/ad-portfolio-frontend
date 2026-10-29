import { terrainProjectPath, terrainProjectFromPath, toTerrainProject } from '../project-data';

// Each scene owns its catalogue. Never put request-specific records in a module global.
export function createProjectCatalog(projects) {
  const entries = projects.map(project => ({ ...project }));
  return {
    getProject: id => entries.find(project => project.id === id) || null,
    getNextProject: id => entries.length ? entries[(entries.findIndex(project => project.id === id) + 1) % entries.length] : null,
    projectFromPath: (pathname, base = '/') => terrainProjectFromPath(pathname, entries, base),
    updateProject(project) {
      const index = entries.findIndex(entry => entry.id === project.slug);
      if (index >= 0) entries[index] = toTerrainProject(project, index);
    },
  };
}
export const normalizeBase = base => terrainProjectPath(null, base);
export const projectPath = (id, base = '/') => terrainProjectPath(id, base);
