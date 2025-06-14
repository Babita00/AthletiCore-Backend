import { Request, Response } from 'express';
import Event from '../models/event.model';
import User from '../models/user.model';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const user = await User.findById(userId);
    if (!user || user.role !== 'Official') {
      return res.status(403).json({ message: 'Only officials can create events' });
    }

    const {
      title,
      description,
      venue,
      date,
      weightCategories,
      competitionType,
      prizes,
      coordinator,
      otherOfficial,
      organizerPhoneNumber,
    } = req.body;

    const newEvent = new Event({
      title,
      description,
      venue,
      date,
      weightCategories,
      competitionType,
      prizes,
      coordinator,
      otherOfficial,
      organizerPhoneNumber,
    });

    await newEvent.save();
    return res.status(201).json({ message: 'Event created', event: newEvent });
  } catch (err) {
    console.error('Create event error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
