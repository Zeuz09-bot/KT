import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { getOrderDetail } from '@/modules/orders/admin-repo';
import { OrderDetailView } from '@/components/admin/order-detail-view';

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id} | Keraunous Admin`,
  };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { id } = await params;
  const order = await getOrderDetail(supabase, id);

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} userRole={profile.role} />;
}
