import { z } from 'zod';

export const reviewSubmissionSchema = z.object({
  status: z.enum(['approved', 'rejected'], { required_error: 'Status is required' }),
  note: z.string().max(500).optional(),
});
