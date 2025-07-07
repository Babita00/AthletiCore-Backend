import express from 'express';
import { userAuth } from '../middleware/authMiddleware';
import {
  createEventForm,
  getEventForm,
  updateEventForm,
  deleteEventForm,
} from '../controllers/eventForm.controller';

import {
  submitEventForm,
  getPlayerSubmissionsForEvent,
  getPlayerSubmissionForEventById,
  reviewPlayerSubmission,
  updateFormFieldsByPlayer,
  deleteSubmittedForm,
  updateFinalStatsByOfficial,
  getMySubmissions,
} from '../controllers/playerSubmission.controller';

import { reviewSubmissionSchema } from '../validations/reviewSubmissionSchema';
import { validate } from '../middleware/validate';

const router = express.Router();

// ---------------------- EVENT FORMS (Official) ----------------------

// Create a form for an event
router.post('/:eventId/forms', userAuth, createEventForm);

// Get form for an event
router.get('/:eventId/forms', getEventForm);

// Update a specific form
router.patch('/forms/:formId', userAuth, updateEventForm);

// Delete a specific form
router.delete('/forms/:formId', userAuth, deleteEventForm);

// ------------------ PLAYER FORM SUBMISSION (Player) ------------------

// Submit a form for an event
router.post('/:eventId/submissions', userAuth, submitEventForm);

// Update form submission (player can update their fields)
router.patch('/submissions/:submissionId', userAuth, updateFormFieldsByPlayer);

// Delete player’s own submission
router.delete('/submissions/:submissionId', userAuth, deleteSubmittedForm);

// Get logged-in player's submissions
router.get('/:eventId/submissions/me', userAuth, getMySubmissions); // ✅ NEW

// ----------------- EVENT SUBMISSIONS (Official) ------------------

// Get all player submissions for an event
router.get('/:eventId/submissions', userAuth, getPlayerSubmissionsForEvent);

// Get a specific submission for an event
router.get('/:eventId/submissions/:submissionId', userAuth, getPlayerSubmissionForEventById); // ✅ NEW

// Update final stats (e.g., weight class, rack height) after weigh-in
router.patch('/submissions/:submissionId/stats', userAuth, updateFinalStatsByOfficial);

// Review a player submission (approve/reject)
router.patch(
  '/submissions/:submissionId/review',
  userAuth,
  validate(reviewSubmissionSchema),
  reviewPlayerSubmission,
);

export default router;
