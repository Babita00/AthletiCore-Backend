import { z } from 'zod';

// Prize Schema
const prizeSchema = z.object({
  prizeTitle: z.string().min(1, 'Prize title is required'),
  weightCategory: z.string().optional(),
});

// Official Contact Schema
const officialContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone_number: z.number().optional(),
  email: z.string().email('Invalid email').optional(),
});

// Main Event Schema
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  venue: z.string().min(1, 'Venue is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  weightCategories: z
    .array(z.string().min(1, 'Weight category is required'))
    .min(1, 'At least one weight category is required'),
  competitionType: z.enum(['Male', 'Female', 'Open']),
  prizes: z.array(prizeSchema).min(1, 'At least one prize is required'),
  coordinator: officialContactSchema,
  otherOfficial: officialContactSchema.optional(),
  organizerPhoneNumber: z.string().min(5, 'Organizer phone is required').optional(),
  eventImage: z.string().url('Invalid image URL').optional(),
  createdby: z.string().optional(),
});
