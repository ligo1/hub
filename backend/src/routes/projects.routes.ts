import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projects.controller';

export const projectsRouter = Router();

projectsRouter.get('/', authenticate, listProjects);
projectsRouter.post('/', authenticate, createProject);
projectsRouter.get('/:id', authenticate, getProject);
projectsRouter.put('/:id', authenticate, updateProject);
projectsRouter.delete('/:id', authenticate, deleteProject);
