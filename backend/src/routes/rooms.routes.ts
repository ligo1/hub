import { Router } from 'express';
import { getRooms, createRoom, getRoomSlots } from '../controllers/rooms.controller';
import { authenticate } from '../middleware/auth';

export const roomsRouter = Router();

roomsRouter.get('/', authenticate, getRooms);
roomsRouter.post('/', authenticate, createRoom);
roomsRouter.get('/:id/slots', authenticate, getRoomSlots);
