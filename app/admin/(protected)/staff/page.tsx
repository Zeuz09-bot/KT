import React from 'react';
import type { Metadata } from 'next';
import { requireOwner } from '@/modules/auth/guards';
import { listStaffAction } from '@/modules/auth/actions';
import { StaffTable } from './StaffTable';

export const metadata: Metadata = {
  title: 'Staff Management | Keraunous Admin',
};

export default async function AdminStaffPage() {
  const { user } = await requireOwner();
  const staffRes = await listStaffAction();
  const initialStaff = staffRes.ok ? staffRes.data : [];

  return <StaffTable initialStaff={initialStaff} currentUserId={user.id} />;
}
