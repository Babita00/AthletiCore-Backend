import { Router } from 'express';
import { createEvent } from '../controllers/event.controller';
import { userAuth } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createEventSchema } from '../validations/event.validation';

const router = Router();

router.post('/create', userAuth, validate(createEventSchema), createEvent);

export default router;
