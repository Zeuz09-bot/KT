'use server';

/**
 * Keraunous Tech Store — Admin Auth Server Actions
 *
 * Implements:
 * - Login with rate limiting (5 attempts / 15 min per IP) and generic failure responses
 * - MFA TOTP challenge and verification
 * - Forced MFA enrollment and recovery code generation
 * - Global session termination (logout everywhere)
 * - Owner-only staff management: invite, deactivate, reactivate, reset MFA, change role
 * - Immutable audit logging for all security events
 */

import crypto from 'crypto';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ok, err, ApiResponse } from '@/lib/result';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';
import { writeAuditLog } from '@/modules/security/audit';
import {
  LoginSchema,
  MfaVerifySchema,
  EnrollMfaVerifySchema,
  InviteStaffSchema,
  DeactivateStaffSchema,
  ResetStaffMfaSchema,
  ChangeStaffRoleSchema,
  AdminUserDTO,
} from '@/lib/contracts/auth';
import { requireOwner, requireAdmin } from './guards';
import { getAdminUserProfile, listAdminUsers } from './repo';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headerList.get('x-real-ip') || '127.0.0.1';
}

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let i = 0; i < 8; i++) {
    let part1 = '';
    let part2 = '';
    const bytes = crypto.randomBytes(8);
    for (let j = 0; j < 4; j++) {
      part1 += chars[bytes[j] % chars.length];
      part2 += chars[bytes[j + 4] % chars.length];
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export type LoginResultData =
  | { step: 'mfa_required'; factorId: string }
  | { step: 'mfa_enroll_required' }
  | { step: 'authenticated'; role: string };

/**
 * Step 1 of login: Email + password.
 * Rate limited to 5 failed attempts per 15 min per IP.
 * Always returns generic error messages to prevent account enumeration.
 */
export async function loginAction(
  formData: unknown,
): Promise<ApiResponse<LoginResultData>> {
  const ip = await getClientIp();
  const ipHash = hashIp(ip);
  const rateLimitKey = `login:${ipHash}`;

  const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    await writeAuditLog({
      action: 'auth.login_rate_limited',
      entity: 'admin_users',
      ipHash,
    });
    return err(
      'RATE_LIMITED',
      'Too many failed login attempts. Please try again in 15 minutes.',
    );
  }

  const parsed = LoginSchema.safeParse(formData);
  if (!parsed.success) {
    return err('UNAUTHENTICATED', 'Invalid credentials.');
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    await writeAuditLog({
      action: 'auth.login_failed',
      entity: 'admin_users',
      ipHash,
      after: { emailDomain: email.split('@')[1] ?? '' },
    });
    return err('UNAUTHENTICATED', 'Invalid credentials.');
  }

  // Check admin_users table
  const profile = await getAdminUserProfile(supabase, authData.user.id);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    await writeAuditLog({
      actorId: authData.user.id,
      action: 'auth.login_denied_inactive',
      entity: 'admin_users',
      entityId: authData.user.id,
      ipHash,
    });
    return err('UNAUTHENTICATED', 'Invalid credentials.');
  }

  // Password passed: reset rate limit for this IP
  resetRateLimit(rateLimitKey);

  // Check TOTP factors
  const { data: factorsData, error: factorsError } =
    await supabase.auth.mfa.listFactors();

  if (factorsError) {
    return err('INTERNAL', 'Failed to retrieve MFA factors.');
  }

  const totpFactors = factorsData.totp.filter(
    (f) => f.status === 'verified',
  );

  if (totpFactors.length === 0) {
    return ok({ step: 'mfa_enroll_required' });
  }

  return ok({
    step: 'mfa_required',
    factorId: totpFactors[0].id,
  });
}

/**
 * Step 2 of login: TOTP verification for existing factor.
 */
export async function verifyMfaAction(
  factorId: string,
  code: string,
): Promise<ApiResponse<{ step: 'authenticated'; role: string }>> {
  const parsed = MfaVerifySchema.safeParse({ code });
  if (!parsed.success || !factorId) {
    return err('VALIDATION_FAILED', 'Invalid authentication code.');
  }

  const supabase = await createClient();
  const ip = await getClientIp();
  const ipHash = hashIp(ip);

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });

  if (error || !data) {
    await writeAuditLog({
      action: 'auth.mfa_failed',
      entity: 'admin_users',
      ipHash,
    });
    return err('VALIDATION_FAILED', 'Invalid verification code. Please check your authenticator app.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err('UNAUTHENTICATED', 'Authentication required.');
  }

  const profile = await getAdminUserProfile(supabase, user.id);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    return err('FORBIDDEN', 'Administrator account is deactivated.');
  }

  await writeAuditLog({
    actorId: user.id,
    action: 'auth.login_success',
    entity: 'admin_users',
    entityId: user.id,
    ipHash,
    after: { role: profile.role },
  });

  return ok({ step: 'authenticated', role: profile.role });
}

export interface MfaEnrollResult {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
  recoveryCodes: string[];
}

/**
 * Initiates TOTP MFA enrollment for a newly logged-in admin.
 */
export async function startMfaEnrollAction(): Promise<ApiResponse<MfaEnrollResult>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return err('UNAUTHENTICATED', 'Please log in with email and password first.');
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'Keraunous Tech Store',
    friendlyName: `Keraunous (${user.email ?? 'Staff'})`,
  });

  if (error || !data) {
    return err('INTERNAL', error?.message || 'Failed to initialize MFA enrollment.');
  }

  const recoveryCodes = generateRecoveryCodes();

  return ok({
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
    recoveryCodes,
  });
}

/**
 * Confirms TOTP MFA enrollment by verifying the first code.
 */
export async function confirmMfaEnrollAction(
  factorId: string,
  code: string,
): Promise<ApiResponse<{ step: 'authenticated'; role: string }>> {
  const parsed = EnrollMfaVerifySchema.safeParse({ factorId, code });
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid factor or verification code.');
  }

  const supabase = await createClient();
  const ip = await getClientIp();
  const ipHash = hashIp(ip);

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: parsed.data.factorId,
    code: parsed.data.code,
  });

  if (error || !data) {
    return err('VALIDATION_FAILED', 'Incorrect verification code. Please try again.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err('UNAUTHENTICATED', 'Authentication required.');
  }

  const profile = await getAdminUserProfile(supabase, user.id);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    return err('FORBIDDEN', 'Administrator account is deactivated.');
  }

  await writeAuditLog({
    actorId: user.id,
    action: 'auth.mfa_enrolled',
    entity: 'admin_users',
    entityId: user.id,
    ipHash,
    after: { role: profile.role },
  });

  return ok({ step: 'authenticated', role: profile.role });
}

/**
 * Logs the administrator out across all sessions.
 */
export async function logoutAction(): Promise<ApiResponse<{ loggedOut: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const ip = await getClientIp();
    await writeAuditLog({
      actorId: user.id,
      action: 'auth.logout',
      entity: 'admin_users',
      entityId: user.id,
      ipHash: hashIp(ip),
    });
  }

  await supabase.auth.signOut({ scope: 'global' });
  return ok({ loggedOut: true });
}

// ============================================================================
// OWNER-ONLY STAFF MANAGEMENT ACTIONS
// ============================================================================

/**
 * List all admin staff members (owner only).
 */
export async function listStaffAction(): Promise<ApiResponse<AdminUserDTO[]>> {
  await requireOwner();
  const adminClient = createAdminClient();

  const supabase = await createClient();
  const staffProfiles = await listAdminUsers(supabase);

  // Augment with email from auth.users via admin client
  const {
    data: { users },
  } = await adminClient.auth.admin.listUsers();

  const userEmailMap = new Map<string, string>();
  if (users) {
    users.forEach((u) => {
      if (u.email) userEmailMap.set(u.id, u.email);
    });
  }

  const result: AdminUserDTO[] = staffProfiles.map((p) => ({
    userId: p.userId,
    email: userEmailMap.get(p.userId) ?? 'Unknown',
    role: p.role,
    displayName: p.displayName,
    isActive: p.isActive,
    createdAt: p.createdAt,
  }));

  return ok(result);
}

/**
 * Invite a new staff member (owner only).
 */
export async function inviteStaffAction(
  formData: unknown,
): Promise<ApiResponse<{ userId: string }>> {
  const { user: ownerUser } = await requireOwner();
  const parsed = InviteStaffSchema.safeParse(formData);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid staff invitation details.', {
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, displayName, role } = parsed.data;
  const adminClient = createAdminClient();

  // Invite user via Supabase Auth Admin API
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email);

  if (inviteError || !inviteData.user) {
    return err('INTERNAL', inviteError?.message || 'Failed to send staff invitation.');
  }

  const newUserId = inviteData.user.id;

  // Insert into admin_users
  const { error: dbError } = await adminClient.from('admin_users').insert({
    user_id: newUserId,
    role,
    display_name: displayName,
    is_active: true,
  });

  if (dbError) {
    return err('INTERNAL', dbError.message || 'Failed to register staff record.');
  }

  await writeAuditLog({
    actorId: ownerUser.id,
    action: 'auth.staff_invited',
    entity: 'admin_users',
    entityId: newUserId,
    after: { email, displayName, role },
  });

  return ok({ userId: newUserId });
}

/**
 * Deactivates a staff member and revokes all active sessions immediately (owner only).
 */
export async function deactivateStaffAction(
  formData: unknown,
): Promise<ApiResponse<{ userId: string }>> {
  const { user: ownerUser } = await requireOwner();
  const parsed = DeactivateStaffSchema.safeParse(formData);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid user ID.');
  }

  const { userId } = parsed.data;
  if (userId === ownerUser.id) {
    return err('FORBIDDEN', 'You cannot deactivate your own account.');
  }

  const adminClient = createAdminClient();

  // Update status in admin_users
  const { error: dbError } = await adminClient
    .from('admin_users')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (dbError) {
    return err('INTERNAL', dbError.message);
  }

  // Revoke all active sessions
  await adminClient.auth.admin.signOut(userId, 'global');

  await writeAuditLog({
    actorId: ownerUser.id,
    action: 'auth.staff_deactivated',
    entity: 'admin_users',
    entityId: userId,
  });

  return ok({ userId });
}

/**
 * Reactivates a previously deactivated staff member (owner only).
 */
export async function reactivateStaffAction(
  formData: unknown,
): Promise<ApiResponse<{ userId: string }>> {
  const { user: ownerUser } = await requireOwner();
  const parsed = DeactivateStaffSchema.safeParse(formData);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid user ID.');
  }

  const { userId } = parsed.data;
  const adminClient = createAdminClient();

  const { error: dbError } = await adminClient
    .from('admin_users')
    .update({ is_active: true })
    .eq('user_id', userId);

  if (dbError) {
    return err('INTERNAL', dbError.message);
  }

  await writeAuditLog({
    actorId: ownerUser.id,
    action: 'auth.staff_reactivated',
    entity: 'admin_users',
    entityId: userId,
  });

  return ok({ userId });
}

/**
 * Resets MFA for a staff member, forcing them to re-enroll (owner only).
 */
export async function resetStaffMfaAction(
  formData: unknown,
): Promise<ApiResponse<{ userId: string }>> {
  const { user: ownerUser } = await requireOwner();
  const parsed = ResetStaffMfaSchema.safeParse(formData);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid user ID.');
  }

  const { userId } = parsed.data;
  const adminClient = createAdminClient();

  // List user factors via Admin API
  const { data: factorsData, error: factorsError } =
    await adminClient.auth.admin.mfa.listFactors({ userId });

  if (factorsError) {
    return err('INTERNAL', factorsError.message);
  }

  // Delete all factors
  if (factorsData && factorsData.factors) {
    for (const factor of factorsData.factors) {
      await adminClient.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId,
      });
    }
  }

  // Terminate their sessions so they must re-authenticate and re-enroll MFA
  await adminClient.auth.admin.signOut(userId, 'global');

  await writeAuditLog({
    actorId: ownerUser.id,
    action: 'auth.staff_mfa_reset',
    entity: 'admin_users',
    entityId: userId,
  });

  return ok({ userId });
}

/**
 * Changes a staff member's role (owner only).
 */
export async function changeStaffRoleAction(
  formData: unknown,
): Promise<ApiResponse<{ userId: string; role: string }>> {
  const { user: ownerUser } = await requireOwner();
  const parsed = ChangeStaffRoleSchema.safeParse(formData);
  if (!parsed.success) {
    return err('VALIDATION_FAILED', 'Invalid input.');
  }

  const { userId, role } = parsed.data;

  // Prevent owner from demoting themselves
  if (userId === ownerUser.id && role !== 'owner') {
    return err('FORBIDDEN', 'You cannot change your own role.');
  }

  const adminClient = createAdminClient();

  const { error: dbError } = await adminClient
    .from('admin_users')
    .update({ role })
    .eq('user_id', userId);

  if (dbError) {
    return err('INTERNAL', dbError.message);
  }

  await writeAuditLog({
    actorId: ownerUser.id,
    action: 'auth.staff_role_changed',
    entity: 'admin_users',
    entityId: userId,
    after: { role },
  });

  return ok({ userId, role });
}
