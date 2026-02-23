import api from './api';
import { Project } from '../types';

type ProjectPayload = {
  title: string;
  description?: string;
  status?: Project['status'];
  color?: string;
  icon?: string;
  startDate?: string | null;
  dueDate?: string | null;
};

export const projectsService = {
  list: async (): Promise<Project[]> => {
    const res = await api.get<{ success: boolean; data: { projects: Project[] } }>('/projects');
    return res.data.data.projects;
  },

  get: async (id: string): Promise<Project> => {
    const res = await api.get<{ success: boolean; data: { project: Project } }>(`/projects/${id}`);
    return res.data.data.project;
  },

  create: async (data: ProjectPayload): Promise<Project> => {
    const res = await api.post<{ success: boolean; data: { project: Project } }>('/projects', data);
    return res.data.data.project;
  },

  update: async (id: string, data: Partial<ProjectPayload>): Promise<Project> => {
    const res = await api.put<{ success: boolean; data: { project: Project } }>(`/projects/${id}`, data);
    return res.data.data.project;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
