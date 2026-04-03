import { z } from 'zod';

export const AdminUserRecordSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  role: z.enum(['user', 'admin']),
  planTier: z.enum(['free', 'pro']),
  waitlistJoinedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
  lastSignInAt: z.string().nullable(),
  aiCreditsUsed: z.number().int().nonnegative(),
});

export const AdminUsersResponseSchema = z.object({
  users: z.array(AdminUserRecordSchema),
});

export const parseAdminUsersResponse = (value: unknown) =>
  AdminUsersResponseSchema.parse(value);
