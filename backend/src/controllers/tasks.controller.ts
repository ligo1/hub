import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string(),
});

const updateTaskSchema = createTaskSchema.omit({ projectId: true }).partial();

export const listTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query as { projectId?: string };
    const tasks = await prisma.task.findMany({
      where: {
        project: { ownerId: req.userId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    sendSuccess(res, { tasks });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createTaskSchema.parse(req.body);
    // Verify ownership of the project
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) return sendError(res, 'Project not found', 404);
    if (project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    const task = await prisma.task.create({ data });
    sendSuccess(res, { task }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!existing) return sendError(res, 'Task not found', 404);
    if (existing.project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    const data = updateTaskSchema.parse(req.body);
    const task = await prisma.task.update({ where: { id: req.params.id }, data });
    sendSuccess(res, { task });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!existing) return sendError(res, 'Task not found', 404);
    if (existing.project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    await prisma.task.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
