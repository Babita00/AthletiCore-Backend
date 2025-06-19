import { Request, Response } from 'express';
import Announcement from '../models/announcement.model';
import User from '../models/user.model';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user._id;
    const { title, message, event, expiryDate } = req.body;

    const user = await User.findById(officialId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can create announcements' });
      return;
    }
    if (event && !mongoose.Types.ObjectId.isValid(event)) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }

    // process uploaded files
    const attachments = req.files ? (req.files as Express.Multer.File[]).map((f) => f.path) : [];

    const announcement = new Announcement({
      title,
      message,
      event: event || undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      attachments,
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

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcementId = req.params.id;
    const officialId = (req as any).user._id;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      res.status(400).json({ message: 'Invalid announcement ID' });
      return;
    }

    const updatedData: any = {
      ...req.body,
      updatedBy: officialId,
    };

    if (req.files) {
      const attachments = (req.files as Express.Multer.File[]).map((f) => f.path);
      updatedData.attachments = attachments;
    }

    const announcement = await Announcement.findByIdAndUpdate(announcementId, updatedData, {
      new: true,
    });

    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }

    res.status(200).json({ message: 'Announcement updated', announcement });
    return;
  } catch (err) {
    console.error('Update announcement error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcementId = req.params.id;
    const officialId = (req as any).user._id;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      res.status(400).json({ message: 'Invalid announcement ID' });
      return;
    }

    // Fetch the announcement
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }

    // Check if user is an official
    const user = await User.findById(officialId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can delete announcements' });
      return;
    }

    // Delete attached files from filesystem
    if (announcement.attachments && announcement.attachments.length > 0) {
      for (const filePath of announcement.attachments) {
        try {
          await fs.unlink(path.resolve(filePath));
        } catch (fileErr) {
          console.warn(`Failed to delete attachment: ${filePath}`, fileErr);
        }
      }
    }

    // Delete the announcement from DB
    await Announcement.findByIdAndDelete(announcementId);

    res.status(200).json({ message: 'Announcement deleted successfully' });
    return;
  } catch (err) {
    console.error('Delete announcement error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
