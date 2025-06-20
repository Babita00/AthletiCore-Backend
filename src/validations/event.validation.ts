import { z } from 'zod';

// Prize Schema
const prizeSchema = z.object({
  prizeTitle: z.string().optional(),
  prize: z.string().optional(),
});

// Official Contact Schema
const officialContactSchema = z.object({
  name: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().optional(),
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
  prizes: z.array(prizeSchema).optional(),
  coordinator: officialContactSchema,
  otherOfficial: officialContactSchema.optional(),
  organizerPhoneNumber: z.string().optional(),
  eventImage: z.string().optional(),
  createdby: z.string().optional(),
});
