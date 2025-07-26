// controllers/playerSubmission.controller.ts
import { Request, Response } from 'express';
import PlayerSubmission from '../models/playerSubmission.model';
import EventForm from '../models/eventForm.model';
import Event from '../models/event.model';
import mongoose from 'mongoose';

// ---- For Players -------
export const submitEventForm = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // if (user.role !== 'Player') {
    //   res.status(403).json({ message: 'Unauthorized: Player only' });
    //   return;
    // }

    const userId = user._id.toString();
    const { eventId } = req.params;
    const { formFields } = req.body;

    const form = await EventForm.findOne({ eventId });
    if (!form) {
      res.status(404).json({ message: 'Form not found for this event' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const alreadySubmitted = await PlayerSubmission.findOne({
      event: eventId,
      user: userId,
    });

    if (alreadySubmitted) {
      res.status(409).json({ message: 'You have already submitted for this event.' });
      return;
    }

    const submission = new PlayerSubmission({
      event: eventId,
      user: userId,
      formFields,
    });

    await submission.save();
    res.status(201).json({ message: 'Form submitted', submission });
    return;
  } catch (err) {
    console.error('Submit form error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const updateFormFieldsByPlayer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if ((req as any).user.role !== 'Player') {
      res.status(403).json({ message: 'Unauthorized: Player only' });
      return;
    }

    const { submissionId } = req.params;
    const { formFields } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      res.status(400).json({ message: 'Invalid submission ID' });
      return;
    }

    const submission = await PlayerSubmission.findById(submissionId);
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    if (submission.user.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Unauthorized: This is not your submission' });
      return;
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ message: 'You can only update while submission is pending' });
      return;
    }

    submission.formFields = formFields;
    submission.updatedAt = new Date();
    await submission.save();

    const updatedSubmission = await PlayerSubmission.findById(submissionId);
    res.status(200).json({ message: 'Form fields updated', submission: updatedSubmission });
    return;
  } catch (err) {
    console.error('Error updating form fields:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const deleteSubmittedForm = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if ((req as any).user.role !== 'player') {
      res.status(403).json({ message: 'Unauthorized: Player only' });
      return;
    }

    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      res.status(400).json({ message: 'Invalid submission ID' });
      return;
    }

    const submission = await PlayerSubmission.findById(submissionId);
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    if (submission.user.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Unauthorized: This is not your submission' });
      return;
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ message: 'Cannot delete submission after it has been reviewed' });
      return;
    }

    await submission.deleteOne();

    res.status(200).json({ message: 'Submission deleted successfully' });
    return;
  } catch (err) {
    console.error('Error deleting submission:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { eventId } = req.params;
    if ((req as any).user.role !== 'Player') {
      res.status(403).json({ message: 'Unauthorized: Player only' });
      return;
    }

    const submissions = await PlayerSubmission.find({ user: userId })
      .populate('event')
      .sort({ createdAt: -1 });

    res.status(200).json(submissions);
  } catch (err) {
    console.error('Error fetching my submissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------For Officials-------

export const getPlayerSubmissionsForEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Fetch all submissions for this event
    const submissions = await PlayerSubmission.find({ event: eventId });

    if (!submissions || submissions.length === 0) {
      res.status(404).json({ message: 'No submissions found for this event' });
      return;
    }

    res.status(200).json(submissions);
    return;
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getPlayerSubmissionForEventById = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;

    const { eventId, submissionId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(submissionId)
    ) {
      res.status(400).json({ message: 'Invalid event ID or submission ID' });
      return;
    }

    const submission = await PlayerSubmission.findOne({ _id: submissionId, event: eventId })
      .populate('user') // Optional: include player details
      .populate('event'); // Optional: include event details

    if (!submission) {
      res.status(404).json({ message: 'Submission not found for this event' });
      return;
    }

    // const event = submission.event as any;

    res.status(200).json({ submission });
  } catch (err) {
    console.error('Error fetching submission by ID for event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const reviewPlayerSubmission = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;

    // if ((req as any).user.role !== 'Official') {
    //   res.status(403).json({ message: 'Unauthorized: Officials only' });
    //   return;
    // }

    const { submissionId } = req.params;
    const { status, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      res.status(400).json({ message: 'Invalid submission ID' });
      return;
    }

    const submission = await PlayerSubmission.findById(submissionId).populate('event');
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    // const event = submission.event as any;
    // if (event.createdby.toString() !== officialId.toString()) {
    //   res.status(403).json({ message: 'Unauthorized: Not your event' });
    //   return;
    // }

    submission.status = status;
    if (note) submission.reviewNote = note;

    await submission.save();

    res.status(200).json({
      message: `Submission ${submission.status}`,
      submission,
    });

    return;
  } catch (err) {
    console.error('Review submission error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const updateFinalStatsByOfficial = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;

    if ((req as any).user.role !== 'Official') {
      res.status(403).json({ message: 'Unauthorized: Officials only' });
      return;
    }

    const { submissionId } = req.params;
    const { finalHeight, finalWeight, finalRackHeight } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      res.status(400).json({ message: 'Invalid submission ID' });
      return;
    }

    const submission = await PlayerSubmission.findById(submissionId);
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' });
      return;
    }

    if (submission.status !== 'approved') {
      res.status(400).json({
        message: 'Final stats can only be set after submission is approved',
      });
      return;
    }

    submission.finalHeight = finalHeight;
    submission.finalWeight = finalWeight;
    submission.finalRackHeight = finalRackHeight;
    submission.updatedAt = new Date();

    await submission.save();

    res.status(200).json({
      message: 'Final stats updated by official',
      submission,
    });
    return;
  } catch (err) {
    console.error('Error updating final stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// New function to get registration data with current attempt weights
export const getPlayerRegistrationWithAttempts = async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const requestingUserId = (req as any).user._id;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid event or user ID' });
      return;
    }

    // Get the registration submission
    const submission = await PlayerSubmission.findOne({
      event: eventId,
      user: userId,
    })
      .populate('user', 'fullName email')
      .populate('event', 'title');

    if (!submission) {
      res.status(404).json({ message: 'Registration not found' });
      return;
    }

    // Get current lift attempts for this user and event
    const LiftAttempt = require('../models/liftAttempt.model').default;
    const attempts = await LiftAttempt.find({
      user: userId,
      event: eventId,
    }).sort({ liftType: 1, attemptNumber: 1 });

    // Organize attempts by lift type
    const attemptsByLift = {
      squat: attempts.filter((a: any) => a.liftType === 'squat'),
      bench: attempts.filter((a: any) => a.liftType === 'bench'),
      deadlift: attempts.filter((a: any) => a.liftType === 'deadlift'),
    };

    // Helper function to get field value from formFields
    const getFieldValue = (key: string) => {
      return submission.formFields.find((field) => field.key === key)?.value || '';
    };

    // Build enhanced registration data with attempt information
    const registrationData = {
      id: submission._id,
      user: submission.user,
      event: submission.event,
      status: submission.status,
      reviewNote: submission.reviewNote,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,

      // Basic registration fields
      personalInfo: {
        firstName: getFieldValue('firstName'),
        lastName: getFieldValue('lastName'),
        age: getFieldValue('age'),
        gender: getFieldValue('gender'),
        bodyWeight: getFieldValue('bodyWeight'),
        height: getFieldValue('height'),
        rackHeight: getFieldValue('rackHeight'),
      },

      // Initial weights from registration
      initialWeights: {
        squat: getFieldValue('static-initial-weight-for-squat'),
        benchPress: getFieldValue('static-initial-weight-for-bench-press'),
        deadlift: getFieldValue('static-initial-weight-for-deadlift'),
      },

      // Current attempt data (updated weights)
      currentAttempts: {
        squat: attemptsByLift.squat.map((attempt: any) => ({
          attemptNumber: attempt.attemptNumber,
          declaredWeight: attempt.declaredWeight,
          actualWeight: attempt.actualWeight,
          status: attempt.status,
          isCurrent: attempt.isCurrent,
          completedAt: attempt.completedAt,
        })),
        bench: attemptsByLift.bench.map((attempt: any) => ({
          attemptNumber: attempt.attemptNumber,
          declaredWeight: attempt.declaredWeight,
          actualWeight: attempt.actualWeight,
          status: attempt.status,
          isCurrent: attempt.isCurrent,
          completedAt: attempt.completedAt,
        })),
        deadlift: attemptsByLift.deadlift.map((attempt: any) => ({
          attemptNumber: attempt.attemptNumber,
          declaredWeight: attempt.declaredWeight,
          actualWeight: attempt.actualWeight,
          status: attempt.status,
          isCurrent: attempt.isCurrent,
          completedAt: attempt.completedAt,
        })),
      },

      // Final measurements (updated by officials)
      finalMeasurements: {
        height: submission.finalHeight,
        weight: submission.finalWeight,
        rackHeight: submission.finalRackHeight,
      },

      // All form fields for backward compatibility
      formFields: submission.formFields,
    };

    res.status(200).json(registrationData);
  } catch (err) {
    console.error('Error fetching registration with attempts:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
