import { Request, Response } from 'express';
import mongoose from 'mongoose';
import LiftAttempt from '../models/liftAttempt.model';
import User from '../models/user.model';
import Event from '../models/event.model';
import PlayerSubmission from '../models/playerSubmission.model';

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
    const { userId, eventId } = req.body;

    // if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(eventId)) {
    //   res.status(400).json({ message: 'Invalid user or event ID' });
    //   return;
    // }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const submission = await PlayerSubmission.findOne({ user: userId, event: eventId });
    if (!submission) {
      res.status(404).json({ message: 'Player submission not found' });
      return;
    }

    const alreadyExists = await LiftAttempt.exists({ user: userId, event: eventId });
    if (alreadyExists) {
      res.status(200).json({ message: 'Lift attempts already initialized' });
      return;
    }

    const initialWeightField = submission.formFields.find((field) => field.key === 'initialWeight');
    const declaredWeight = initialWeightField ? Number(initialWeightField.value) : 0;

    const liftTypes: LiftType[] = ['squat', 'bench', 'deadlift'];

    for (const liftType of liftTypes) {
      for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber++) {
        await LiftAttempt.create({
          user: userId,
          event: eventId,
          liftType,
          attemptNumber,
          declaredWeight: attemptNumber === 1 ? declaredWeight : 0,
          isCurrent: attemptNumber === 1,
        });
      }
    }

    const attempts = await LiftAttempt.find({ user: userId, event: eventId }).lean();

    const groupedAttempts: Record<LiftType, AttemptDTO[]> = {
      squat: [],
      bench: [],
      deadlift: [],
    };

    for (const attempt of attempts) {
      const lift = attempt.liftType as LiftType;

      const status =
        attempt.status === 'pending' ? (attempt.isCurrent ? 'available' : 'pending') : 'submitted';

      const result =
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

    res.status(201).json(groupedAttempts);
  } catch (err) {
    console.error('Initialize lift attempts error:', err);
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

// Player updates nextWeight on the current attempt
export const submitNextWeight = async (req: Request, res: Response) => {
  try {
    const { nextWeight } = req.body;
    const { attemptId } = req.params;

    const attempt = await LiftAttempt.findById(attemptId);
    if (!attempt) {
      res.status(404).json({ message: 'Attempt not found' });
      return;
    }

    if (!attempt.isCurrent) {
      res.status(400).json({ message: 'Cannot update non-current attempt' });
      return;
    }

    // Prevent update on first attempt
    if (attempt.attemptNumber === 1) {
      res.status(400).json({ message: 'First attempt weight cannot be changed' });
      return;
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
