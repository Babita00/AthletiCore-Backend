import { Request, Response } from 'express';
import Event from '../models/event.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user;
    const user = await User.findById(userId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can create events' });
      return;
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
    const eventImage = req.file ? req.file.path : undefined;

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
      eventImage,
      createdby: userId,
    });

    const savedEvent = await newEvent.save();
    const populatedEvent = await savedEvent.populate('createdby', 'fullName');
    res.status(201).json({
      message: 'Event created',
      event: populatedEvent,
    });

    return;
  } catch (err) {
    console.error('Create event error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getAllEvents = async (_req: Request, res: Response) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
    return;
  } catch (err) {
    console.error('Get all events error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json(event);
    return;
  } catch (err) {
    console.error('Get event error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getMyEvents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user._id) {
      res.status(401).json({ message: 'Unauthorized: No user data found' });
      return;
    }

    const userId = user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    if (user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can view their events' });
      return;
    }

    const events = await Event.find({ createdby: userId });

    res.status(200).json(events);
    return;
  } catch (err) {
    console.error('Get my events error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can update events' });
      return;
    }

    const updateData = {
      ...req.body,
      eventImage: req.file ? req.file.path : undefined,
    };

    // Remove undefined fields (e.g. no new image provided)
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedEvent) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({ message: 'Event updated', event: updatedEvent });
    return;
  } catch (err) {
    console.error('Update event error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid event ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can delete events' });
      return;
    }

    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({ message: 'Event deleted' });
    return;
  } catch (err) {
    console.error('Delete event error', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
