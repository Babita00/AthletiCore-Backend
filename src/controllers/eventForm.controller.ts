// controllers/eventForm.controller.ts
import { Request, Response } from 'express';
import EventForm from '../models/eventForm.model';
import Event from '../models/event.model';
import User from '../models/user.model';

export const createEventForm = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;
    const { eventId } = req.params;
    const { fields } = req.body;

    // Check official and event validity
    const user = await User.findById(officialId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can create forms' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found ' });
      return;
    }
    if (event.createdby.toString() !== officialId.toString()) {
      res.status(404).json({ message: ' user id does not match' });
      return;
    }

    // Create form
    const form = new EventForm({
      eventId,
      fields,
      createdBy: officialId,
    });

    await form.save();
    res.status(201).json({ message: 'Form created', form });
    return;
  } catch (err) {
    console.error('Create form error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

export const getEventForm = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const form = await EventForm.findOne({ eventId });

    if (!form) {
      res.status(404).json({ message: 'Form not found for this event' });
      return;
    }

    res.status(200).json(form);
    return;
  } catch (err) {
    console.error('Get form error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

// Update an existing event form
export const updateEventForm = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;
    const { formId } = req.params;
    const { fields } = req.body;

    const form = await EventForm.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    // Check if the user is the creator of the form
    if (form.createdBy.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'Unauthorized to update this form' });
      return;
    }

    // Update fields
    form.fields = fields;
    await form.save();

    res.status(200).json({ message: 'Form updated', form });
    return;
  } catch (err) {
    console.error('Update form error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};

// Delete an existing event form
export const deleteEventForm = async (req: Request, res: Response) => {
  try {
    const officialId = (req as any).user.id;
    const { formId } = req.params;

    const form = await EventForm.findById(formId);
    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    if (form.createdBy.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'Unauthorized to delete this form' });
      return;
    }

    await EventForm.findByIdAndDelete(formId);

    res.status(200).json({ message: 'Form deleted successfully' });
    return;
  } catch (err) {
    console.error('Delete form error:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
};
