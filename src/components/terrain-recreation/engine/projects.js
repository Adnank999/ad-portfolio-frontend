import { terrainProjects, terrainProjectPath, terrainProjectFromPath } from '../project-data';

export const PROJECTS = terrainProjects;
export const getProject = id => PROJECTS.find(project => project.id === id) || null;
export const getNextProject = id => PROJECTS[(PROJECTS.findIndex(project => project.id === id) + 1) % PROJECTS.length];
export const normalizeBase = base => terrainProjectPath(null, base);
export const projectPath = (id, base = '/') => terrainProjectPath(id, base);
export const projectFromPath = (pathname, base = '/') => terrainProjectFromPath(pathname, base);
