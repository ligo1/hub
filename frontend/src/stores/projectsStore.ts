import { create } from 'zustand';
import { Project, Task, Note } from '../types';
import { projectsService } from '../services/projects.service';
import { tasksService } from '../services/tasks.service';
import { notesService } from '../services/notes.service';

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (p: Project) => void;
  updateProject: (p: Project) => void;
  removeProject: (id: string) => void;
  addTask: (projectId: string, task: Task) => void;
  updateTask: (projectId: string, task: Task) => void;
  removeTask: (projectId: string, taskId: string) => void;
  addNote: (projectId: string, note: Note) => void;
  updateNote: (projectId: string, note: Note) => void;
  removeNote: (projectId: string, noteId: string) => void;
}

const recalcProgress = (tasks: Task[]) => {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.status === 'DONE').length / tasks.length) * 100);
};

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await projectsService.list();
      set({ projects });
    } finally {
      set({ loading: false });
    }
  },

  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),

  updateProject: (p) =>
    set((s) => ({ projects: s.projects.map((x) => (x.id === p.id ? p : x)) })),

  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  addTask: (projectId, task) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const tasks = [...p.tasks, task];
        return { ...p, tasks, progress: recalcProgress(tasks) };
      }),
    })),

  updateTask: (projectId, task) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const tasks = p.tasks.map((t) => (t.id === task.id ? task : t));
        return { ...p, tasks, progress: recalcProgress(tasks) };
      }),
    })),

  removeTask: (projectId, taskId) =>
    set((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== projectId) return p;
        const tasks = p.tasks.filter((t) => t.id !== taskId);
        return { ...p, tasks, progress: recalcProgress(tasks) };
      }),
    })),

  addNote: (projectId, note) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== projectId ? p : { ...p, notes: [note, ...p.notes] }
      ),
    })),

  updateNote: (projectId, note) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== projectId
          ? p
          : { ...p, notes: p.notes.map((n) => (n.id === note.id ? note : n)) }
      ),
    })),

  removeNote: (projectId, noteId) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id !== projectId ? p : { ...p, notes: p.notes.filter((n) => n.id !== noteId) }
      ),
    })),
}));
