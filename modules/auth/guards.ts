/**
 * Keraunous Tech Store — Auth Guards
 *
 * Server-side protection helpers.
 * Used inside every admin server action and data function.
 * Enforces:
 *  - Valid Supabase session
 *  - Active record in `admin_users` table
 *  - TOTP MFA verified (AAL2)
 *  - Role-based authorization ('owner' vs 'staff')
 */

import 'server-only';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/result';
import { getAdminUserProfile, AdminUserProfile } from './repo';

export interface AdminContext {
  user: User;
  profile: AdminUserProfile;
}

/**
 * Pure verification helper for testing and reuse.
 */
export function verifyAdminAccess(
  user: User | null,
  profile: AdminUserProfile | null,
  aal: string | null | undefined,
): AdminContext {
  if (!user) {
    throw new AppError('UNAUTHENTICATED', 'Authentication required. Please log in.');
  }

  if (!profile) {
    throw new AppError('FORBIDDEN', 'Access denied: account is not registered as an administrator.');
  }

  if (!profile.isActive) {
    throw new AppError('FORBIDDEN', 'Access denied: administrator account is deactivated.');
  }

  if (aal !== 'aal2') {
    throw new AppError('FORBIDDEN', 'MFA verification required (AAL2). Please complete two-factor authentication.');
  }

  return { user, profile };
}

/**
 * Pure verification helper for owner-only actions.
 */
export function verifyOwnerAccess(
  user: User | null,
  profile: AdminUserProfile | null,
  aal: string | null | undefined,
): AdminContext {
  const adminCtx = verifyAdminAccess(user, profile, aal);

  if (adminCtx.profile.role !== 'owner') {
    throw new AppError('FORBIDDEN', 'Permission denied: owner role required for this action.');
  }

  return adminCtx;
}

/**
 * Guard for any admin server action or server component data function.
 * Ensures the caller is authenticated, active in admin_users, and verified with AAL2 MFA.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AppError('UNAUTHENTICATED', 'Authentication required. Please log in.');
  }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = aalData?.currentLevel;

  const profile = await getAdminUserProfile(supabase, user.id);

  return verifyAdminAccess(user, profile, currentLevel);
}

/**
 * Guard for owner-only server actions (e.g. staff management, bulk price update, settings change).
 * Ensures the caller is an active owner verified with AAL2 MFA.
 */
export async function requireOwner(): Promise<AdminContext> {
  const adminCtx = await requireAdmin();

  if (adminCtx.profile.role !== 'owner') {
    throw new AppError('FORBIDDEN', 'Permission denied: owner role required for this action.');
  }

  return adminCtx;
}
