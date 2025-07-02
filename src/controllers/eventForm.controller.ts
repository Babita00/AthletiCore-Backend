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

    const user = await User.findById(officialId);
    if (!user || user.role !== 'Official') {
      res.status(403).json({ message: 'Only officials can create forms' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    if (event.createdby.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'User not authorized to create form for this event' });
      return;
    }

    // 🚫 Prevent creating a new form if one already exists for the event
    const existingForm = await EventForm.findOne({ eventId });
    if (existingForm) {
      res.status(400).json({
        message: 'Form already exists for this event. Use the update endpoint to modify it.',
        formId: existingForm._id,
      });
      return;
    }

    // ✅ Create new form
    const form = new EventForm({
      eventId,
      fields,
      createdBy: officialId,
    });

    await form.save();
    res.status(201).json({ message: 'Form created', form });
  } catch (err) {
    console.error('Create form error:', err);
    res.status(500).json({ message: 'Server error' });
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

    if (form.createdBy.toString() !== officialId.toString()) {
      res.status(403).json({ message: 'Unauthorized to update this form' });
      return;
    }

    // 🆕 Combine existing fields + new fields
    const combinedFields = [...form.fields, ...fields];

    // 🧹 Deduplicate by fieldName — keep the last occurrence
    const uniqueFieldsMap = new Map();
    for (const field of combinedFields) {
      uniqueFieldsMap.set(field.fieldName.toLowerCase(), field);
    }

    // Final deduplicated fields array
    const deduplicatedFields = Array.from(uniqueFieldsMap.values());

    // Update and save
    form.fields = deduplicatedFields;
    form.updatedAt = new Date();
    await form.save();

    res.status(200).json({ message: 'Form updated', form });
  } catch (err) {
    console.error('Update form error:', err);
    res.status(500).json({ message: 'Server error' });
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
