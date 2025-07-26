import { Request, Response } from 'express';
import mongoose from 'mongoose';
import LiftAttempt from '../models/liftAttempt.model';
import User from '../models/user.model';
import Event from '../models/event.model';
import PlayerSubmission from '../models/playerSubmission.model';
import EventForm from '../models/eventForm.model';
import { FORM_FIELD_KEYS, LIFT_TYPES, ATTEMPT_STATUS } from '../constants';
type LiftType = 'squat' | 'bench' | 'deadlift';

interface AttemptDTO {
  id: string;
  round: 1 | 2 | 3;
  weight: number;
  status: 'available' | 'pending' | 'submitted';
  locked: boolean;
  changes: number;
  result: 'success' | 'failed' | null;
}

// ✅ Initialize 3 attempts for each lift type
export const initializeLiftAttempts = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    const userId = (req as any).user._id;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: 'Invalid user or event ID' });
      return;
    }

    // ✅ Use correct keys for query
    const registrationForm = await PlayerSubmission.findOne({ event: eventId, user: userId });

    if (!registrationForm) {
      res.status(404).json({ message: 'Player registration form not found' });
      return;
    }

    // ✅ Use correct field name: formFields - Flexible approach
    // Flexible field extraction - try multiple patterns
    const findWeightField = (patterns: string[]) => {
      for (const pattern of patterns) {
        const field = registrationForm.formFields.find(
          (f) => f.key?.toLowerCase().includes(pattern.toLowerCase()) || f.key === pattern,
        );
        if (field && field.value) {
          return parseFloat(field.value.toString()) || 0;
        }
      }
      return 0;
    };

    const squatInitialWeight = findWeightField([
      FORM_FIELD_KEYS.INITIAL_SQUAT_WEIGHT,
      'static-initial-weight-for-squat',
      'initialWeightForSquat',
      'squatWeight',
      'squat',
      'field_2', // Based on your earlier data
    ]);

    const benchPressInitialWeight = findWeightField([
      FORM_FIELD_KEYS.INITIAL_BENCH_WEIGHT,
      'static-initial-weight-for-bench-press',
      'initialWeightForBench',
      'benchWeight',
      'bench',
      'field_3', // Based on your earlier data
    ]);

    const deadliftInitialWeight = findWeightField([
      FORM_FIELD_KEYS.INITIAL_DEADLIFT_WEIGHT,
      'static-initial-weight-for-deadlift',
      'initialWeightForDeadlift',
      'deadliftWeight',
      'deadlift',
      'field_4', // Based on your earlier data
    ]);

    // Check if lift attempts already exist for this user and event
    const existingAttempts = await LiftAttempt.find({ user: userId, event: eventId });
    if (existingAttempts.length > 0) {
      res
        .status(409)
        .json({ message: 'Lift attempts already initialized for this user and event' });
      return;
    }

    // Create LiftAttempt documents instead of updating user
    const liftAttempts = [];

    // Create squat attempts
    for (let i = 1; i <= 3; i++) {
      liftAttempts.push({
        user: userId,
        event: eventId,
        liftType: 'squat',
        attemptNumber: i,
        declaredWeight: i === 1 ? parseFloat(squatInitialWeight.toString()) || 0 : 0,
        status: 'pending',
        isCurrent: i === 1, // First attempt is current
      });
    }

    // Create bench press attempts
    for (let i = 1; i <= 3; i++) {
      liftAttempts.push({
        user: userId,
        event: eventId,
        liftType: 'bench',
        attemptNumber: i,
        declaredWeight: i === 1 ? parseFloat(benchPressInitialWeight.toString()) || 0 : 0,
        status: 'pending',
        isCurrent: i === 1, // First attempt is current
      });
    }

    // Create deadlift attempts
    for (let i = 1; i <= 3; i++) {
      liftAttempts.push({
        user: userId,
        event: eventId,
        liftType: 'deadlift',
        attemptNumber: i,
        declaredWeight: i === 1 ? parseFloat(deadliftInitialWeight.toString()) || 0 : 0,
        status: 'pending',
        isCurrent: i === 1, // First attempt is current
      });
    }

    // Insert all attempts
    const createdAttempts = await LiftAttempt.insertMany(liftAttempts);

    res.status(200).json({
      message: 'Lift attempts initialized successfully',
      attempts: createdAttempts,
    });
  } catch (err) {
    console.error('Error initializing lift attempts:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLiftAttempts = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: 'Invalid user or event ID' });
      return;
    }

    const attempts = await LiftAttempt.find({ user: userId, event: eventId }).lean();

    const groupedAttempts: Record<LiftType, AttemptDTO[]> = {
      squat: [],
      bench: [],
      deadlift: [],
    };

    for (const attempt of attempts) {
      const lift = attempt.liftType as LiftType;
      if (!['squat', 'bench', 'deadlift'].includes(lift)) continue;

      const status: AttemptDTO['status'] =
        attempt.status === 'pending' ? (attempt.isCurrent ? 'available' : 'pending') : 'submitted';

      const result: AttemptDTO['result'] =
        attempt.status === 'pass' ? 'success' : attempt.status === 'fail' ? 'failed' : null;

      groupedAttempts[lift].push({
        id: attempt._id.toString(),
        round: attempt.attemptNumber,
        weight: attempt.declaredWeight,
        status,
        locked: !attempt.isCurrent,
        changes: (attempt.attemptNumber === 2 ? 1 : 2) - (attempt.updateCount || 0),
        result,
      });
    }

    res.status(200).json(groupedAttempts);
  } catch (err) {
    console.error('Get lift attempts error:', err);
    res.status(500).json({ message: 'Error fetching lift attempts' });
  }
};

// Player updates nextWeight for current or future attempts
export const submitNextWeight = async (req: Request, res: Response) => {
  try {
    const { nextWeight } = req.body;
    const { attemptId } = req.params;

    const attempt = await LiftAttempt.findById(attemptId);
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    // Check if attempt is already completed
    if (attempt.status !== 'pending') {
      res.status(400).json({ message: 'Cannot update completed attempt' });
      return;
    }

    // Prevent update on first attempt (initial weight should remain)
    if (attempt.attemptNumber === 1) {
      res.status(400).json({ message: 'First attempt weight cannot be changed' });
      return;
    }

    // Allow updating current attempt OR future attempts
    // Check if this is a valid future attempt (previous attempts must exist)
    if (!attempt.isCurrent) {
      const previousAttempt = await LiftAttempt.findOne({
        user: attempt.user,
        event: attempt.event,
        liftType: attempt.liftType,
        attemptNumber: attempt.attemptNumber - 1,
      });

      if (!previousAttempt) {
        res.status(400).json({ message: 'Previous attempt not found' });
        return;
      }

      // For future attempts, only allow if previous attempt exists (no sequence restriction)
      console.log(`Updating future attempt ${attempt.attemptNumber} for ${attempt.liftType}`);
    }

    // Define max allowed updates based on attempt number
    const maxUpdates = attempt.attemptNumber === 2 ? 1 : 2;

    if ((attempt.updateCount ?? 0) >= maxUpdates) {
      res.status(400).json({
        message: `Update limit reached for attempt ${attempt.attemptNumber}`,
      });
      return;
    }

    attempt.declaredWeight = nextWeight;
    attempt.updateCount = (attempt.updateCount || 0) + 1;
    await attempt.save();

    res.status(200).json({ message: 'Next weight submitted', attempt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Official updates status of an attempt
export const updateLiftStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { attemptId } = req.params;

    const attempt = await LiftAttempt.findById(attemptId);
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    // Mark current attempt as done
    attempt.status = status;
    attempt.isCurrent = false;
    attempt.actualWeight = attempt.declaredWeight;
    attempt.completedAt = new Date();
    await attempt.save();

    // Activate next attempt (if any)
    const nextAttempt = await LiftAttempt.findOne({
      user: attempt.user,
      event: attempt.event,
      liftType: attempt.liftType,
      attemptNumber: attempt.attemptNumber + 1,
    });

    if (nextAttempt) {
      nextAttempt.isCurrent = true;
      await nextAttempt.save();
    }

    res.status(200).json({ message: 'Attempt status updated', nextAttempt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current lifters with active attempts in an event
export const getCurrentLifters = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }

    const currentLifters = await LiftAttempt.find({
      event: eventId,
      isCurrent: true,
    }).populate('user', 'fullName gender weight');

    if (currentLifters.length === 0) {
      res.status(200).json({ message: 'No current lifters', lifters: [] });
      return;
    }

    res.status(200).json(currentLifters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current attempts for a specific user in an event
export const getCurrentAttemptsForUser = async (req: Request, res: Response) => {
  try {
    const { userId, eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: 'Invalid user or event ID' });
      return;
    }

    const currentAttempts = await LiftAttempt.find({
      user: userId,
      event: eventId,
      isCurrent: true,
    });

    const attemptsByLift = {
      squat: currentAttempts.find((a) => a.liftType === 'squat') || null,
      bench: currentAttempts.find((a) => a.liftType === 'bench') || null,
      deadlift: currentAttempts.find((a) => a.liftType === 'deadlift') || null,
    };

    res.status(200).json({
      message: 'Current attempts for user',
      currentAttempts: attemptsByLift,
      totalCurrentAttempts: currentAttempts.length,
    });
  } catch (err) {
    console.error('Get current attempts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
