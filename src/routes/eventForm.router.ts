// routes/eventForm.routes.ts
import express from 'express';
import { userAuth } from '../middleware/authMiddleware';
import { createEventForm, getEventForm } from '../controllers/eventForm.controller';
import {
  submitEventForm,
  getPlayerSubmissionsForEvent,
  reviewPlayerSubmission,
} from '../controllers/playerSubmission.controller';
import { reviewSubmissionSchema } from '../validations/reviewSubmissionSchema';
import { validate } from '../middleware/validate';

const router = express.Router();

// Official creates form for an event
router.post('/create', userAuth, createEventForm);

// Get form structure for an event
router.get('/:eventId', getEventForm);

// Player submits form
router.post('/:eventId/submit', userAuth, submitEventForm);

// Official gets submissions for event
router.get('/:eventId/submissions', userAuth, getPlayerSubmissionsForEvent);

// routes/eventForm.routes.ts

// Official approves/rejects a player submission
router.patch(
  '/submissions/:submissionId/review',
  userAuth,
  validate(reviewSubmissionSchema), // use Zod or Joi
  reviewPlayerSubmission,
);

export default router;
