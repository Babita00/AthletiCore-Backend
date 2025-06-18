import { z } from 'zod';

export const reviewSubmissionSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected'], {
      required_error: 'Status is required',
      invalid_type_error: 'Status must be either "approved" or "rejected"',
    }),
    note: z.string().max(500, 'Note must be at most 500 characters').optional(),
  }),
});
