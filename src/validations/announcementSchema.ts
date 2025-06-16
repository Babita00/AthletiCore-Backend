import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    event: z.string().optional(),
  }),
});
