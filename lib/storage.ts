import { Project, Comment } from '@/types';

const STORAGE_KEY = 'visual-feedback-projects';

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects:', error);
  }
}

export function getProjectById(id: string): Project | undefined {
  const projects = loadProjects();
  return projects.find(p => p.id === id);
}
