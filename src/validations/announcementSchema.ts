import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),

  event: z.string().nullable().optional(),

  expiryDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : undefined),
    z.date().optional(),
  ),
  attachments: z.any().optional(), // attachments are handled via multer
});
