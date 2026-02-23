import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateProjectSchema = createProjectSchema.partial();

const projectInclude = {
  tasks: { orderBy: { createdAt: 'asc' as const } },
  notes: { orderBy: { updatedAt: 'desc' as const } },
};

const calcProgress = (tasks: { status: string }[]) => {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  return Math.round((done / tasks.length) * 100);
};

export const listProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.userId },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });
    const withProgress = projects.map((p) => ({ ...p, progress: calcProgress(p.tasks) }));
    sendSuccess(res, { projects: withProgress });
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: projectInclude,
    });
    if (!project) return sendError(res, 'Project not found', 404);
    if (project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);
    sendSuccess(res, { project: { ...project, progress: calcProgress(project.tasks) } });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: { ...data, ownerId: req.userId! },
      include: projectInclude,
    });
    sendSuccess(res, { project: { ...project, progress: 0 } }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Project not found', 404);
    if (existing.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: projectInclude,
    });
    sendSuccess(res, { project: { ...project, progress: calcProgress(project.tasks) } });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Project not found', 404);
    if (existing.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    await prisma.project.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};
