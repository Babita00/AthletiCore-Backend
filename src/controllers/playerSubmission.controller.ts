// controllers/playerSubmission.controller.ts
import { Request, Response } from 'express';
import PlayerSubmission from '../models/playerSubmission.model';
import User from '../models/user.model';
import EventForm from '../models/eventForm.model';
import Event from '../models/event.model';
import mongoose from 'mongoose';

// ---- For Players -------
export const submitEventForm = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if ((req as any).user.role.toLowerCase() !== 'player') {
      res.status(403).json({ message: 'Unauthorized: Player only' });
      return;
    }

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

    const alreadySubmitted = await PlayerSubmission.findOne({ event: eventId, user: userId });
    if (alreadySubmitted) {
      res.status(409).json({ message: 'You have already submitted for this event.' });
      return;
    }

    const submission = new PlayerSubmission({
      event: eventId,
      user: userId,
      formFields: formFields,
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

    if ((req as any).user.role.toLowerCase() !== 'player') {
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

    if ((req as any).user.role !== 'player') {
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
    const officialId = (req as any).user.id;

    if ((req as any).user.role !== 'official') {
      res.status(403).json({ message: 'Unauthorized: Officials only' });
      return;
    }

    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event || event.createdby.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'Unauthorized access to submissions' });
      return;
    }

    const submissions = await PlayerSubmission.find({ event: eventId });
    if (!submissions) {
      res.status(404).json({ message: 'Form not found for this event' });
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

export const reviewPlayerSubmission = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;

    if ((req as any).user.role !== 'official') {
      res.status(403).json({ message: 'Unauthorized: Officials only' });
      return;
    }

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

    const event = submission.event as any;
    if (event.createdby.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'Unauthorized: Not your event' });
      return;
    }

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

    if ((req as any).user.role !== 'official') {
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
