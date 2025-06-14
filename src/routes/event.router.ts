import { Router } from 'express';
import { createEvent } from '../controllers/event.controller';
import { userAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createEventSchema } from '../validations/event.validation';
import { uploadEventImage } from '../middleware/upload';

const router = Router();

router.post('/create', userAuth, uploadEventImage, validate(createEventSchema), createEvent);

export default router;
