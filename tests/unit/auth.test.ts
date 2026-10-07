/**
 * Keraunous Tech Store — Unit Tests: Admin Auth & Role Guards
 *
 * Verifies:
 * - Auth validation schemas (Login, MFA, Invite, Deactivate, Role Change)
 * - Guard logic (requireAdmin, requireOwner)
 * - Strict enforcement of AAL2 MFA requirement
 * - Strict role separation (Staff cannot perform Owner actions)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LoginSchema,
  MfaVerifySchema,
  EnrollMfaVerifySchema,
  InviteStaffSchema,
  DeactivateStaffSchema,
  ResetStaffMfaSchema,
  ChangeStaffRoleSchema,
} from '@/lib/contracts/auth';
import { AppError } from '@/lib/result';

// Mock server-only
vi.mock('server-only', () => ({}));

// Import guard functions under test
import { verifyAdminAccess, verifyOwnerAccess } from '@/modules/auth/guards';
import type { AdminUserProfile } from '@/modules/auth/repo';

describe('Auth Contracts & Validation Schemas', () => {
  describe('LoginSchema', () => {
    it('accepts valid email and password', () => {
      const result = LoginSchema.safeParse({
        email: 'owner@keraunous.ng',
        password: 'securepassword123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('owner@keraunous.ng');
      }
    });

    it('trims email whitespace', () => {
      const result = LoginSchema.safeParse({
        email: '  owner@keraunous.ng  ',
        password: 'securepassword123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('owner@keraunous.ng');
      }
    });

    it('rejects invalid email formats', () => {
      const result = LoginSchema.safeParse({
        email: 'not-an-email',
        password: 'securepassword123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = LoginSchema.safeParse({
        email: 'owner@keraunous.ng',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('MfaVerifySchema', () => {
    it('accepts exact 6 digit codes', () => {
      const result = MfaVerifySchema.safeParse({ code: '123456' });
      expect(result.success).toBe(true);
    });

    it('rejects non-numeric codes', () => {
      const result = MfaVerifySchema.safeParse({ code: '12345a' });
      expect(result.success).toBe(false);
    });

    it('rejects codes with length !== 6', () => {
      expect(MfaVerifySchema.safeParse({ code: '12345' }).success).toBe(false);
      expect(MfaVerifySchema.safeParse({ code: '1234567' }).success).toBe(false);
    });
  });

  describe('EnrollMfaVerifySchema', () => {
    it('accepts factorId and 6-digit code', () => {
      const result = EnrollMfaVerifySchema.safeParse({
        factorId: 'factor-abc-123',
        code: '654321',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty factorId', () => {
      const result = EnrollMfaVerifySchema.safeParse({
        factorId: '',
        code: '654321',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('InviteStaffSchema', () => {
    it('accepts valid staff invite', () => {
      const result = InviteStaffSchema.safeParse({
        email: 'staff1@keraunous.ng',
        displayName: 'John Staff',
        role: 'staff',
      });
      expect(result.success).toBe(true);
    });

    it('defaults role to staff if not provided', () => {
      const result = InviteStaffSchema.safeParse({
        email: 'staff2@keraunous.ng',
        displayName: 'Jane Staff',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('staff');
      }
    });

    it('rejects invalid roles', () => {
      const result = InviteStaffSchema.safeParse({
        email: 'staff3@keraunous.ng',
        displayName: 'Jane Staff',
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });

    it('rejects too short displayName', () => {
      const result = InviteStaffSchema.safeParse({
        email: 'staff4@keraunous.ng',
        displayName: 'A',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DeactivateStaffSchema & ResetStaffMfaSchema', () => {
    it('accepts valid UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(DeactivateStaffSchema.safeParse({ userId: validUuid }).success).toBe(true);
      expect(ResetStaffMfaSchema.safeParse({ userId: validUuid }).success).toBe(true);
    });

    it('rejects non-UUID strings', () => {
      expect(DeactivateStaffSchema.safeParse({ userId: 'not-a-uuid' }).success).toBe(false);
      expect(ResetStaffMfaSchema.safeParse({ userId: 'not-a-uuid' }).success).toBe(false);
    });
  });

  describe('ChangeStaffRoleSchema', () => {
    it('accepts valid UUID and valid role', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = ChangeStaffRoleSchema.safeParse({
        userId: validUuid,
        role: 'owner',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = ChangeStaffRoleSchema.safeParse({
        userId: validUuid,
        role: 'guest',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Admin & Owner Guard Verification Logic', () => {
  const activeStaffProfile: AdminUserProfile = {
    userId: 'user-staff-1',
    role: 'staff',
    displayName: 'Staff Member',
    isActive: true,
    createdAt: '2026-10-07T00:00:00Z',
  };

  const activeOwnerProfile: AdminUserProfile = {
    userId: 'user-owner-1',
    role: 'owner',
    displayName: 'Store Owner',
    isActive: true,
    createdAt: '2026-10-07T00:00:00Z',
  };

  const inactiveOwnerProfile: AdminUserProfile = {
    userId: 'user-owner-2',
    role: 'owner',
    displayName: 'Deactivated Owner',
    isActive: false,
    createdAt: '2026-10-07T00:00:00Z',
  };

  it('throws UNAUTHENTICATED if session or user is missing', () => {
    expect(() => {
      verifyAdminAccess(null, null, 'aal2');
    }).toThrow(AppError);

    try {
      verifyAdminAccess(null, null, 'aal2');
    } catch (err: any) {
      expect(err.code).toBe('UNAUTHENTICATED');
    }
  });

  it('throws FORBIDDEN if user is authenticated but not in admin_users', () => {
    expect(() => {
      verifyAdminAccess({ id: 'random-user-id' } as any, null, 'aal2');
    }).toThrow(AppError);

    try {
      verifyAdminAccess({ id: 'random-user-id' } as any, null, 'aal2');
    } catch (err: any) {
      expect(err.code).toBe('FORBIDDEN');
    }
  });

  it('throws FORBIDDEN if admin user is deactivated', () => {
    expect(() => {
      verifyAdminAccess({ id: inactiveOwnerProfile.userId } as any, inactiveOwnerProfile, 'aal2');
    }).toThrow(AppError);

    try {
      verifyAdminAccess({ id: inactiveOwnerProfile.userId } as any, inactiveOwnerProfile, 'aal2');
    } catch (err: any) {
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toMatch(/inactive|deactivated/i);
    }
  });

  it('throws FORBIDDEN if MFA (AAL2) is missing or still at AAL1', () => {
    expect(() => {
      verifyAdminAccess({ id: activeStaffProfile.userId } as any, activeStaffProfile, 'aal1');
    }).toThrow(AppError);

    try {
      verifyAdminAccess({ id: activeStaffProfile.userId } as any, activeStaffProfile, 'aal1');
    } catch (err: any) {
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toMatch(/mfa/i);
    }
  });

  it('passes verifyAdminAccess for active staff with AAL2', () => {
    const result = verifyAdminAccess(
      { id: activeStaffProfile.userId, email: 'staff@keraunous.ng' } as any,
      activeStaffProfile,
      'aal2',
    );
    expect(result.profile.role).toBe('staff');
    expect(result.profile.userId).toBe(activeStaffProfile.userId);
  });

  it('passes verifyAdminAccess for active owner with AAL2', () => {
    const result = verifyAdminAccess(
      { id: activeOwnerProfile.userId, email: 'owner@keraunous.ng' } as any,
      activeOwnerProfile,
      'aal2',
    );
    expect(result.profile.role).toBe('owner');
    expect(result.profile.userId).toBe(activeOwnerProfile.userId);
  });

  it('throws FORBIDDEN if staff attempts an owner-only action', () => {
    expect(() => {
      verifyOwnerAccess(
        { id: activeStaffProfile.userId, email: 'staff@keraunous.ng' } as any,
        activeStaffProfile,
        'aal2',
      );
    }).toThrow(AppError);

    try {
      verifyOwnerAccess(
        { id: activeStaffProfile.userId, email: 'staff@keraunous.ng' } as any,
        activeStaffProfile,
        'aal2',
      );
    } catch (err: any) {
      expect(err.code).toBe('FORBIDDEN');
      expect(err.message).toMatch(/owner/i);
    }
  });

  it('passes verifyOwnerAccess for active owner with AAL2', () => {
    const result = verifyOwnerAccess(
      { id: activeOwnerProfile.userId, email: 'owner@keraunous.ng' } as any,
      activeOwnerProfile,
      'aal2',
    );
    expect(result.profile.role).toBe('owner');
    expect(result.profile.userId).toBe(activeOwnerProfile.userId);
  });
});
