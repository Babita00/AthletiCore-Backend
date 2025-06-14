import { z } from 'zod';

const prizeSchema = z.object({
  prizeTitle: z.string().min(1, 'Prize title required'),
  weightCategory: z.string().optional(),
});

const officialContactSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phoneNumber: z.string().min(5, 'Phone number required'),
  email: z.string().email('Invalid email').optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  venue: z.string().min(1, 'Venue is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  weightCategories: z
    .array(z.string().min(1, 'Weight category required'))
    .min(1, 'At least one weight category'),
  competitionType: z.enum(['Male', 'Female', 'All']),
  prizes: z.array(prizeSchema).min(1, 'At least one prize required'),
  coordinator: officialContactSchema,
  otherOfficial: officialContactSchema,
  organizerPhoneNumber: z.string().min(5, 'Organizer phone required'),
});
