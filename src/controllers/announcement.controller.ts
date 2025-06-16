import { Request, Response } from 'express';
import Announcement from '../models/announcement.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user._id;
    const { title, message, event } = req.body;

    const user = await User.findById(officialId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can create announcements' });
      return;
    }

    if (event && !mongoose.Types.ObjectId.isValid(event)) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }

    const announcement = new Announcement({
      title,
      message,
      event: event || undefined,
      createdBy: officialId,
    });

    await announcement.save();

    res.status(201).json({ message: 'Announcement created', announcement });
    return;
  } catch (err) {
    console.error('Create announcement error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { event } = req.query;

    let filter = {};
    if (event) {
      if (!mongoose.Types.ObjectId.isValid(event as string)) {
        res.status(400).json({ message: 'Invalid event ID in query' });
        return;
      }
      filter = { event };
    }

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    res.status(200).json(announcements);
    return;
  } catch (err) {
    console.error('Get announcements error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
