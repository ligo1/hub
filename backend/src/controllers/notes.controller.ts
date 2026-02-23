import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  projectId: z.string(),
});

const updateNoteSchema = createNoteSchema.omit({ projectId: true }).partial();

export const listNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query as { projectId?: string };
    const notes = await prisma.note.findMany({
      where: {
        project: { ownerId: req.userId },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, { notes });
  } catch (err) {
    next(err);
  }
};

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createNoteSchema.parse(req.body);
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) return sendError(res, 'Project not found', 404);
    if (project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    const note = await prisma.note.create({ data });
    sendSuccess(res, { note }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!existing) return sendError(res, 'Note not found', 404);
    if (existing.project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    const data = updateNoteSchema.parse(req.body);
    const note = await prisma.note.update({ where: { id: req.params.id }, data });
    sendSuccess(res, { note });
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!existing) return sendError(res, 'Note not found', 404);
    if (existing.project.ownerId !== req.userId) return sendError(res, 'Forbidden', 403);

    await prisma.note.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
};
