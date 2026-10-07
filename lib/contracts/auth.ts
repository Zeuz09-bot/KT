/**
 * Keraunous Tech Store — Auth Contracts
 * Zod validation schemas and DTOs for Admin Authentication and Roles (U03).
 */
import { z } from 'zod';
import type { AdminRole } from '@/lib/database.types';

export const AdminRoleEnum = z.enum(['owner', 'staff']);

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const MfaVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'TOTP verification code must be exactly 6 digits'),
});

export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

export const EnrollMfaVerifySchema = z.object({
  factorId: z.string().min(1, 'Factor ID is required'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'TOTP verification code must be exactly 6 digits'),
});

export type EnrollMfaVerifyInput = z.infer<typeof EnrollMfaVerifySchema>;

export const InviteStaffSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name cannot exceed 50 characters'),
  role: AdminRoleEnum.default('staff'),
});

export type InviteStaffInput = z.infer<typeof InviteStaffSchema>;

export const DeactivateStaffSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export type DeactivateStaffInput = z.infer<typeof DeactivateStaffSchema>;

export const ResetStaffMfaSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export type ResetStaffMfaInput = z.infer<typeof ResetStaffMfaSchema>;

export const ChangeStaffRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: AdminRoleEnum,
});

export type ChangeStaffRoleInput = z.infer<typeof ChangeStaffRoleSchema>;

export interface AdminUserDTO {
  userId: string;
  email?: string;
  role: AdminRole;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  hasMfa?: boolean;
}
