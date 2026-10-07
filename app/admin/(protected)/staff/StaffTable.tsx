'use client';

/**
 * Keraunous Tech Store — Staff Management Table (Client Component)
 *
 * Allows Owners to:
 * - View all administrative users
 * - Invite new staff members via email
 * - Deactivate or reactivate staff accounts
 * - Reset MFA factors
 * - Change roles between staff and owner
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Shield,
  UserX,
  UserCheck,
  KeyRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AdminUserDTO } from '@/lib/contracts/auth';
import {
  inviteStaffAction,
  deactivateStaffAction,
  reactivateStaffAction,
  resetStaffMfaAction,
  changeStaffRoleAction,
} from '@/modules/auth/actions';

interface StaffTableProps {
  initialStaff: AdminUserDTO[];
  currentUserId: string;
}

export function StaffTable({ initialStaff, currentUserId }: StaffTableProps) {
  const router = useRouter();
  const [staffList, setStaffList] = useState<AdminUserDTO[]>(initialStaff);
  const [isInviting, setIsInviting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'owner'>('staff');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setFeedbackMsg(null);
    setActionLoadingId('invite');

    try {
      const res = await inviteStaffAction({
        email: inviteEmail,
        displayName: inviteDisplayName,
        role: inviteRole,
      });

      if (!res.ok) {
        setInviteError(res.error.message);
        setActionLoadingId(null);
        return;
      }

      setFeedbackMsg({
        type: 'success',
        text: `Invitation sent to ${inviteEmail}. Account registered.`,
      });
      setInviteEmail('');
      setInviteDisplayName('');
      setIsInviting(false);
      router.refresh();
    } catch {
      setInviteError('Failed to invite staff member.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (userId === currentUserId) return;
    setActionLoadingId(userId);
    setFeedbackMsg(null);

    try {
      const res = await deactivateStaffAction({ userId });
      if (!res.ok) {
        setFeedbackMsg({ type: 'error', text: res.error.message });
      } else {
        setStaffList((prev) =>
          prev.map((s) => (s.userId === userId ? { ...s, isActive: false } : s)),
        );
        setFeedbackMsg({
          type: 'success',
          text: 'Account deactivated and all active sessions terminated.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Action failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    setActionLoadingId(userId);
    setFeedbackMsg(null);

    try {
      const res = await reactivateStaffAction({ userId });
      if (!res.ok) {
        setFeedbackMsg({ type: 'error', text: res.error.message });
      } else {
        setStaffList((prev) =>
          prev.map((s) => (s.userId === userId ? { ...s, isActive: true } : s)),
        );
        setFeedbackMsg({ type: 'success', text: 'Account reactivated.' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Action failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetMfa = async (userId: string) => {
    if (!confirm('Are you sure you want to reset MFA for this user? They will be forced to re-enroll next time they log in.')) {
      return;
    }
    setActionLoadingId(userId);
    setFeedbackMsg(null);

    try {
      const res = await resetStaffMfaAction({ userId });
      if (!res.ok) {
        setFeedbackMsg({ type: 'error', text: res.error.message });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: 'MFA factor reset. The user must enroll TOTP upon next login.',
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to reset MFA.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (
    userId: string,
    newRole: 'staff' | 'owner',
  ) => {
    if (userId === currentUserId) return;
    setActionLoadingId(userId);
    setFeedbackMsg(null);

    try {
      const res = await changeStaffRoleAction({ userId, role: newRole });
      if (!res.ok) {
        setFeedbackMsg({ type: 'error', text: res.error.message });
      } else {
        setStaffList((prev) =>
          prev.map((s) => (s.userId === userId ? { ...s, role: newRole } : s)),
        );
        setFeedbackMsg({
          type: 'success',
          text: `Role updated to ${newRole}.`,
        });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to change role.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Staff & Administrators
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Manage admin users, roles, active statuses, and two-factor authentication.
          </p>
        </div>

        <Button
          onClick={() => {
            setIsInviting(!isInviting);
            setInviteError(null);
          }}
          variant="primary"
          className="w-fit"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isInviting ? 'Cancel' : 'Invite Staff Member'}
        </Button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          role="alert"
          className={`p-3 rounded-lg text-sm flex items-center gap-2.5 animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Invite Staff Card */}
      {isInviting && (
        <div className="bg-white border border-accent-orange/30 rounded-xl p-5 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent-orange" />
            <h2 className="font-semibold text-text-primary text-sm">
              Invite New Staff Member
            </h2>
          </div>

          {inviteError && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
              {inviteError}
            </div>
          )}

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Input
                id="inviteDisplayName"
                label="Full Name / Display Name"
                required
                placeholder="e.g. Adeolu John"
                value={inviteDisplayName}
                onChange={(e) => setInviteDisplayName(e.target.value)}
                disabled={actionLoadingId === 'invite'}
              />
            </div>

            <div>
              <Input
                id="inviteEmail"
                label="Email Address"
                type="email"
                required
                placeholder="staff@keraunous.ng"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={actionLoadingId === 'invite'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'staff' | 'owner')}
                disabled={actionLoadingId === 'invite'}
                className="w-full h-10 px-3 rounded-lg border border-border-default bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
              >
                <option value="staff">Staff (Standard)</option>
                <option value="owner">Owner (Full Privileges)</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsInviting(false)}
                disabled={actionLoadingId === 'invite'}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={actionLoadingId === 'invite'}
              >
                {actionLoadingId === 'invite' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Sending Invitation...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white border border-border-default rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-text-secondary border-b border-border-default text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Administrator</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {staffList.map((member) => {
                const isSelf = member.userId === currentUserId;
                const isLoading = actionLoadingId === member.userId;

                return (
                  <tr key={member.userId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-text-primary">
                        {member.displayName}
                        {isSelf && (
                          <span className="ml-2 text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">
                        {member.userId.slice(0, 8)}...
                      </div>
                    </td>

                    <td className="px-5 py-4 text-text-secondary">
                      {member.email || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant={member.role === 'owner' ? 'bestseller' : 'generic'}
                        className="capitalize text-xs"
                      >
                        {member.role}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          member.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.isActive ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        />
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Change Role Toggle */}
                        {!isSelf && (
                          <button
                            onClick={() =>
                              handleChangeRole(
                                member.userId,
                                member.role === 'owner' ? 'staff' : 'owner',
                              )
                            }
                            disabled={isLoading}
                            className="px-2.5 py-1 text-xs border border-border-default rounded-lg hover:bg-neutral-50 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                            title="Toggle between staff and owner"
                          >
                            <Shield className="w-3.5 h-3.5 inline mr-1" />
                            {member.role === 'owner' ? 'Demote to Staff' : 'Promote to Owner'}
                          </button>
                        )}

                        {/* Reset MFA */}
                        <button
                          onClick={() => handleResetMfa(member.userId)}
                          disabled={isLoading}
                          className="px-2.5 py-1 text-xs border border-border-default rounded-lg hover:bg-amber-50 text-amber-700 hover:text-amber-800 transition-colors disabled:opacity-50"
                          title="Reset TOTP factor"
                        >
                          <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                          Reset 2FA
                        </button>

                        {/* Deactivate / Reactivate Toggle */}
                        {!isSelf && (
                          member.isActive ? (
                            <button
                              onClick={() => handleDeactivate(member.userId)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Deactivate account and revoke sessions"
                            >
                              <UserX className="w-3.5 h-3.5 inline mr-1" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(member.userId)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Reactivate account"
                            >
                              <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                              Reactivate
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
