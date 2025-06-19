import { z } from 'zod';

// Common fields
const genderEnum = z.enum(['Male', 'Female', 'Other']).optional();
const roleEnum = z.enum(['Official', 'Player']);

// ✅ Register validation
export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    phone_number: z.string().optional(),
    role: roleEnum,
    gender: genderEnum,
    password: z.string().min(6, 'Password must be at least 6 characters'),
    age: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'Player') {
        return data.age !== undefined && data.weight !== undefined;
      }
      return true;
    },
    {
      message: 'Players must provide age and weight',
      path: ['age'], // Could also add "weight" but one is enough to trigger
    },
  );

// ✅ Login validation
export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ✅ Refresh token validation
export const refreshSchema = z.object({
  token: z.string().min(1, 'Refresh token is required'),
});
