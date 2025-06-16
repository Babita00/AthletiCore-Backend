import { Router } from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
} from '../controllers/event.controller';
import { userAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createEventSchema } from '../validations/event.validation';
import { uploadEventImage } from '../middleware/upload';

const router = Router();

router.post('/create', userAuth, uploadEventImage, validate(createEventSchema), createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.get('/my-events', userAuth, getMyEvents);
router.patch('/:id', userAuth, uploadEventImage, updateEvent);
router.delete('/:id', userAuth, deleteEvent);

export default router;
