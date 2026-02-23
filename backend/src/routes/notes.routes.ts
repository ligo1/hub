import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listNotes, createNote, updateNote, deleteNote } from '../controllers/notes.controller';

export const notesRouter = Router();

notesRouter.get('/', authenticate, listNotes);
notesRouter.post('/', authenticate, createNote);
notesRouter.put('/:id', authenticate, updateNote);
notesRouter.delete('/:id', authenticate, deleteNote);
