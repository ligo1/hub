import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listTasks, createTask, updateTask, deleteTask } from '../controllers/tasks.controller';

export const tasksRouter = Router();

tasksRouter.get('/', authenticate, listTasks);
tasksRouter.post('/', authenticate, createTask);
tasksRouter.put('/:id', authenticate, updateTask);
tasksRouter.delete('/:id', authenticate, deleteTask);
