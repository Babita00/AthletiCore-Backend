import { Router } from 'express';
import { userAuth } from '../middleware/authMiddleware';
const router = Router();
import {
  initializeLiftAttempts,
  submitNextWeight,
  updateLiftStatus,
  getCurrentLifters,
} from '../controllers/liftAttempt.controller';
router.post('/init-lifts', userAuth, initializeLiftAttempts); // admin or auto-call
router.patch('/:attemptId/submit-weight', userAuth, submitNextWeight);
router.patch('/:attemptId/update-status', userAuth, updateLiftStatus);
router.get('/event/:eventId/current-lifters', getCurrentLifters);
export default router;
