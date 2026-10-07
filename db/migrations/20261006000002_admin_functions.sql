-- =====================================================================
-- Keraunous Tech Store — Admin & Order Helper RPC Functions
-- Blueprint: Section 7.7
-- =====================================================================

-- 1. adjust_order_item_price
create or replace function adjust_order_item_price(
  p_item_id uuid,
  p_new_price int,
  p_reason text
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item record;
  v_order record;
  v_old_price int;
  v_new_subtotal int;
  v_actor_id uuid := auth.uid();
begin
  if not is_admin() or not has_mfa() then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Admin MFA required.'));
  end if;

  if p_new_price < 0 or trim(coalesce(p_reason, '')) = '' then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'VALIDATION_FAILED', 'message', 'Valid non-negative price and non-empty reason required.'));
  end if;

  select oi.*, o.status as order_status, o.id as parent_order_id
  into v_item
  from order_items oi
  join orders o on o.id = oi.order_id
  where oi.id = p_item_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Order item not found.'));
  end if;

  if v_item.order_status not in ('new', 'confirmed') then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'INVALID_TRANSITION', 'message', 'Price adjustment only allowed on new or confirmed orders.'));
  end if;

  v_old_price := v_item.unit_price_ngn;

  -- Update item
  update order_items
  set unit_price_ngn = p_new_price
  where id = p_item_id;

  -- Recalculate order subtotal
  select coalesce(sum(unit_price_ngn * qty), 0) into v_new_subtotal
  from order_items
  where order_id = v_item.parent_order_id;

  update orders
  set subtotal_ngn = v_new_subtotal
  where id = v_item.parent_order_id;

  -- Log event
  insert into order_events (
    order_id, type, actor_id, note, is_customer_visible, meta
  ) values (
    v_item.parent_order_id, 'price_adjusted', v_actor_id,
    'Price adjusted: ₦' || v_old_price || ' → ₦' || p_new_price || '. Reason: ' || p_reason,
    true,
    jsonb_build_object('item_id', p_item_id, 'old_price', v_old_price, 'new_price', p_new_price, 'reason', p_reason)
  );

  -- Log audit
  insert into audit_log (
    actor_id, action, entity, entity_id, before, after
  ) values (
    v_actor_id, 'order.price_adjusted', 'order_items', p_item_id::text,
    jsonb_build_object('unit_price_ngn', v_old_price),
    jsonb_build_object('unit_price_ngn', p_new_price, 'reason', p_reason)
  );

  return jsonb_build_object('ok', true, 'data', jsonb_build_object('order_id', v_item.parent_order_id, 'new_subtotal_ngn', v_new_subtotal));
end;
$$;

-- 2. set_delivery_fee
create or replace function set_delivery_fee(
  p_order_id uuid,
  p_fee int
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_old_fee int;
  v_actor_id uuid := auth.uid();
begin
  if not is_admin() or not has_mfa() then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Admin MFA required.'));
  end if;

  if p_fee < 0 then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'VALIDATION_FAILED', 'message', 'Delivery fee must be non-negative.'));
  end if;

  select * into v_order from orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Order not found.'));
  end if;

  if v_order.status not in ('new', 'confirmed') then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'INVALID_TRANSITION', 'message', 'Delivery fee adjustment only allowed on new or confirmed orders.'));
  end if;

  v_old_fee := v_order.delivery_fee_ngn;

  update orders
  set delivery_fee_ngn = p_fee
  where id = p_order_id;

  insert into order_events (
    order_id, type, actor_id, note, is_customer_visible, meta
  ) values (
    p_order_id, 'delivery_fee_set', v_actor_id,
    'Delivery fee set to ₦' || p_fee,
    true,
    jsonb_build_object('old_fee', v_old_fee, 'new_fee', p_fee)
  );

  return jsonb_build_object('ok', true, 'data', jsonb_build_object('order_id', p_order_id, 'delivery_fee_ngn', p_fee));
end;
$$;

-- 3. mark_whatsapp_opened
create or replace function mark_whatsapp_opened(
  p_public_id text,
  p_token_ok boolean
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
begin
  if not p_token_ok then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Invalid handoff token.'));
  end if;

  update orders
  set whatsapp_opened_at = coalesce(whatsapp_opened_at, now())
  where public_id = p_public_id
  returning id into v_order_id;

  if found then
    insert into order_events (
      order_id, type, note, is_customer_visible
    ) values (
      v_order_id, 'whatsapp_opened', 'Customer clicked WhatsApp link', false
    );
    return jsonb_build_object('ok', true, 'data', jsonb_build_object('public_id', p_public_id, 'marked', true));
  end if;

  return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Order not found.'));
end;
$$;

revoke execute on function mark_whatsapp_opened(text, boolean) from public, anon, authenticated;

-- 4. apply_bulk_price (Owner only)
create or replace function apply_bulk_price(
  p_change_set jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_variant_id uuid;
  v_old_variant record;
  v_actor_id uuid := auth.uid();
  v_updated_count int := 0;
begin
  if not is_owner() or not has_mfa() then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Owner MFA required.'));
  end if;

  for v_item in select * from jsonb_array_elements(p_change_set) loop
    v_variant_id := (v_item->>'variant_id')::uuid;

    select * into v_old_variant from product_variants where id = v_variant_id for update;
    if found then
      update product_variants
      set price_ngn = coalesce((v_item->>'price_ngn')::int, price_ngn),
          sale_price_ngn = (v_item->>'sale_price_ngn')::int,
          sale_starts_at = (v_item->>'sale_starts_at')::timestamptz,
          sale_ends_at = (v_item->>'sale_ends_at')::timestamptz
      where id = v_variant_id;

      v_updated_count := v_updated_count + 1;

      insert into audit_log (
        actor_id, action, entity, entity_id, before, after
      ) values (
        v_actor_id, 'price.bulk_apply', 'product_variants', v_variant_id::text,
        jsonb_build_object('price_ngn', v_old_variant.price_ngn, 'sale_price_ngn', v_old_variant.sale_price_ngn),
        v_item
      );
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'data', jsonb_build_object('updated_count', v_updated_count));
end;
$$;

-- 5. expire_stale_holds
create or replace function expire_stale_holds()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_hold_hours int := 24;
  v_auto_cancel boolean := false;
  v_cutoff timestamptz;
  v_stale_order record;
  v_expired_count int := 0;
begin
  select coalesce((value->>'hours')::int, 24) into v_hold_hours
  from site_settings where key = 'hold_hours';

  select coalesce((value->>'enabled')::boolean, false) into v_auto_cancel
  from site_settings where key = 'auto_cancel_stale';

  v_cutoff := now() - (v_hold_hours || ' hours')::interval;

  for v_stale_order in
    select id, public_id from orders
    where status = 'confirmed'
      and payment_confirmed_at is null
      and confirmed_at <= v_cutoff
  loop
    v_expired_count := v_expired_count + 1;

    if v_auto_cancel then
      perform transition_order(
        v_stale_order.id,
        'cancelled',
        jsonb_build_object('reason', 'Auto-cancelled: payment hold expired after ' || v_hold_hours || ' hours')
      );
    else
      insert into order_events (
        order_id, type, note, is_customer_visible
      ) values (
        v_stale_order.id, 'hold_expired',
        'Payment hold expired (' || v_hold_hours || ' hours elapsed). Seller follow-up required.',
        false
      );
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'data', jsonb_build_object('expired_count', v_expired_count, 'auto_cancelled', v_auto_cancel));
end;
$$;
