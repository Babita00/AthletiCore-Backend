// controllers/playerSubmission.controller.ts
import { Request, Response } from 'express';
import PlayerSubmission from '../models/playerSubmission.model';
import EventForm from '../models/eventForm.model';
import Event from '../models/event.model';

export const submitEventForm = async (req: Request, res: Response) => {
  try {
    const playerId = (req as any).user;
    const { eventId } = req.params;
    const { values } = req.body;

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

    const submission = new PlayerSubmission({
      eventId,
      formId: form._id,
      playerId,
      values,
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

export const getPlayerSubmissionsForEvent = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event || event.createdby.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'Unauthorized access to submissions' });
      return;
    }

    const submissions = await PlayerSubmission.find({ eventId });
    res.status(200).json(submissions);
    return;
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
