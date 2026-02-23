import api from './api';
import { Task } from '../types';

type TaskPayload = {
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string | null;
  projectId: string;
};

export const tasksService = {
  list: async (projectId?: string): Promise<Task[]> => {
    const params = projectId ? { projectId } : {};
    const res = await api.get<{ success: boolean; data: { tasks: Task[] } }>('/tasks', { params });
    return res.data.data.tasks;
  },

  create: async (data: TaskPayload): Promise<Task> => {
    const res = await api.post<{ success: boolean; data: { task: Task } }>('/tasks', data);
    return res.data.data.task;
  },

  update: async (id: string, data: Partial<Omit<TaskPayload, 'projectId'>>): Promise<Task> => {
    const res = await api.put<{ success: boolean; data: { task: Task } }>(`/tasks/${id}`, data);
    return res.data.data.task;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
