// routes/eventForm.routes.ts
import express from 'express';
import { userAuth } from '../middleware/authMiddleware';
import { createEventForm, getEventForm ,updateEventForm, deleteEventForm} from '../controllers/eventForm.controller';
import {
  submitEventForm,
  getPlayerSubmissionsForEvent,
  reviewPlayerSubmission,
  updateSubmittedForm,
  deleteSubmittedForm
} from '../controllers/playerSubmission.controller';
import { reviewSubmissionSchema } from '../validations/reviewSubmissionSchema';
import { validate } from '../middleware/validate';

const router = express.Router();

// Official creates form for an event
router.post('/', userAuth, createEventForm);

// Get form structure for an event
router.get('/:eventId', getEventForm);

// Official updates the form
router.patch('/:formId', userAuth, updateEventForm);

//Official deletes the form
router.delete('/:formId', userAuth, deleteEventForm);

// --------------routes/eventForm.routes.ts-------------------

// Player submits form
router.post('/:eventId/submit', userAuth, submitEventForm);

// Official gets submissions for event
router.get('/:eventId/submissions', userAuth, getPlayerSubmissionsForEvent);

// Player updates their submission
router.put(
  '/submissions/:submissionId/update',
  userAuth,
  updateSubmittedForm
);

// player deletes their submission
  router.delete('/submissions/:submissionId/delete',
  userAuth,
  deleteSubmittedForm
);


// Official approves/rejects a player submission
router.patch(
  '/submissions/:submissionId/review',
  userAuth,
  validate(reviewSubmissionSchema),
  reviewPlayerSubmission,
);

export default router;
