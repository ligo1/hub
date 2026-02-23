import { Router } from 'express';
import {
  getUser,
  updateUser,
  addInstrument,
  removeInstrument,
  getAvailability,
  updateAvailability,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';

export const usersRouter = Router();

usersRouter.get('/:id', authenticate, getUser);
usersRouter.put('/:id', authenticate, updateUser);
usersRouter.post('/:id/instruments', authenticate, addInstrument);
usersRouter.delete('/:id/instruments/:instrumentId', authenticate, removeInstrument);
usersRouter.get('/:id/availability', authenticate, getAvailability);
usersRouter.put('/:id/availability', authenticate, updateAvailability);
usersRouter.post('/:id/wishlist', authenticate, addToWishlist);
usersRouter.delete('/:id/wishlist/:songId', authenticate, removeFromWishlist);
