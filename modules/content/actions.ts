'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireOwner } from '@/modules/auth/guards';
import { writeAuditLog } from '@/modules/security/audit';
import { ok, err, type ApiResponse, type ErrorCode } from '@/lib/result';
import {
  BannerSchema,
  CampaignSchema,
  TrustBarSchema,
  SiteSettingsSchema,
  type BannerInput,
  type CampaignInput,
  type TrustBar,
  type SiteSettingsInput,
} from '@/lib/contracts/content';
import type { Json } from '@/lib/database.types';
import {
  adminGetBanner,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminGetCampaign,
  adminSaveCampaign,
  adminGetAllSettings,
  adminUpdateSettings,
  type BannerRow,
  type CampaignRow,
} from './repo';
import { z } from 'zod';

export type Result<T> = ApiResponse<T>;

function fail(
  code: ErrorCode | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR',
  message: string,
  details?: unknown,
): ApiResponse<never> {
  const mappedCode: ErrorCode =
    code === 'VALIDATION_ERROR' || code === 'CONFLICT'
      ? 'VALIDATION_FAILED'
      : code === 'INTERNAL_ERROR'
      ? 'INTERNAL'
      : code;
  return err(mappedCode, message, details as Record<string, unknown> | undefined);
}

function revalidateHome() {
  try {
    revalidateTag('home');
  } catch {
    // revalidateTag might be a no-op outside Next.js request context (e.g. tests)
  }
}

// ---------------------------------------------------------------------------
// Banner Actions (Staff + Owner)
// ---------------------------------------------------------------------------

export async function saveBannerAction(rawInput: unknown): Promise<Result<BannerRow>> {
  const adminCtx = await requireAdmin();
  const parsed = BannerSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid banner data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const input = parsed.data;

  try {
    let result: BannerRow;
    let beforeState: BannerRow | null = null;

    if (input.id) {
      beforeState = await adminGetBanner(supabase, input.id);
      result = await adminUpdateBanner(supabase, input.id, input);

      await writeAuditLog({
        actorId: adminCtx.user.id,
        action: 'banner.update',
        entity: 'banners',
        entityId: input.id,
        before: (beforeState as unknown as Json) ?? null,
        after: (result as unknown as Json) ?? null,
      });
    } else {
      result = await adminCreateBanner(supabase, input);

      await writeAuditLog({
        actorId: adminCtx.user.id,
        action: 'banner.create',
        entity: 'banners',
        entityId: result.id,
        after: (result as unknown as Json) ?? null,
      });
    }

    revalidateHome();
    return ok(result);
  } catch (e) {
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'Failed to save banner');
  }
}

export async function deleteBannerAction(id: string): Promise<Result<{ id: string }>> {
  const adminCtx = await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) {
    return fail('VALIDATION_ERROR', 'Invalid banner ID');
  }

  const supabase = await createClient();

  try {
    const beforeState = await adminGetBanner(supabase, id);
    if (!beforeState) {
      return fail('NOT_FOUND', 'Banner not found');
    }

    await adminDeleteBanner(supabase, id);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'banner.delete',
      entity: 'banners',
      entityId: id,
      before: (beforeState as unknown as Json) ?? null,
    });

    revalidateHome();
    return ok({ id });
  } catch (e) {
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'Failed to delete banner');
  }
}

// ---------------------------------------------------------------------------
// Campaign Actions (Flash Sale — Staff + Owner)
// ---------------------------------------------------------------------------

export async function saveCampaignAction(rawInput: unknown): Promise<Result<CampaignRow>> {
  const adminCtx = await requireAdmin();
  const parsed = CampaignSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid campaign data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const input = parsed.data;

  try {
    let beforeState: CampaignRow | null = null;
    if (input.id) {
      beforeState = await adminGetCampaign(supabase, input.id);
    }

    // Blueprint §U06 item 2: only one active at a time
    if (input.is_active) {
      const { error: deactivateError } = await supabase
        .from('campaigns')
        .update({ is_active: false })
        .neq('id', input.id ?? '00000000-0000-0000-0000-000000000000');

      if (deactivateError) throw deactivateError;
    }

    const result = await adminSaveCampaign(supabase, input);

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: input.id ? 'campaign.update' : 'campaign.create',
      entity: 'campaigns',
      entityId: result.id,
      before: (beforeState as unknown as Json) ?? null,
      after: (result as unknown as Json) ?? null,
    });

    revalidateHome();
    return ok(result);
  } catch (e) {
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'Failed to save campaign');
  }
}

// ---------------------------------------------------------------------------
// Trust Bar Action (Staff + Owner)
// ---------------------------------------------------------------------------

export async function saveTrustBarAction(rawInput: unknown): Promise<Result<TrustBar>> {
  const adminCtx = await requireAdmin();
  const parsed = TrustBarSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid trust bar data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();

  try {
    const allSettings = await adminGetAllSettings(supabase);
    const beforeVal = allSettings['trust_bar'];

    await adminUpdateSettings(
      supabase,
      { trust_bar: parsed.data },
      adminCtx.user.id,
    );

    await writeAuditLog({
      actorId: adminCtx.user.id,
      action: 'trust_bar.update',
      entity: 'site_settings',
      entityId: 'trust_bar',
      before: (beforeVal as unknown as Json) ?? null,
      after: ({ trust_bar: parsed.data } as unknown as Json),
    });

    revalidateHome();
    return ok(parsed.data);
  } catch (e) {
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'Failed to save trust bar');
  }
}

// ---------------------------------------------------------------------------
// Owner-Only Settings Action (§U06 item 4)
// ---------------------------------------------------------------------------

export async function saveSettingsAction(rawInput: unknown): Promise<Result<{ success: true }>> {
  // STRICT: Owner role required! Staff are forbidden.
  const ownerCtx = await requireOwner();
  const parsed = SiteSettingsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Invalid settings data', parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const input = parsed.data;

  try {
    const existingSettings = await adminGetAllSettings(supabase);

    // Alert / Audit for WhatsApp number change
    const oldPhone = existingSettings['whatsapp_number'];
    if (oldPhone && oldPhone !== input.whatsapp_number) {
      await writeAuditLog({
        actorId: ownerCtx.user.id,
        action: 'settings.whatsapp_changed',
        entity: 'site_settings',
        entityId: 'whatsapp_number',
        before: ({ whatsapp_number: oldPhone } as unknown as Json),
        after: ({ whatsapp_number: input.whatsapp_number } as unknown as Json),
      });
    }

    await adminUpdateSettings(supabase, input, ownerCtx.user.id);

    await writeAuditLog({
      actorId: ownerCtx.user.id,
      action: 'settings.update',
      entity: 'site_settings',
      entityId: 'global',
      after: (input as unknown as Json) ?? null,
    });

    revalidateHome();
    return ok({ success: true });
  } catch (e) {
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'Failed to save settings');
  }
}
