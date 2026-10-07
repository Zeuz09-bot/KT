-- =====================================================================
-- Keraunous Tech Store — Migration 003: Auth Helpers & Admin Audit Triggers
-- Blueprint: Section 3, Section 7.6, Section 7.7 (U03)
-- =====================================================================

-- 1. Function to deactivate admin user (Owner only RPC)
create or replace function deactivate_admin_user(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if not is_owner() or not has_mfa() then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Owner MFA required.'));
  end if;

  if p_user_id = v_actor_id then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'FORBIDDEN', 'message', 'Cannot deactivate own account.'));
  end if;

  update admin_users
  set is_active = false
  where user_id = p_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', jsonb_build_object('code', 'NOT_FOUND', 'message', 'Admin user not found.'));
  end if;

  return jsonb_build_object('ok', true, 'data', jsonb_build_object('user_id', p_user_id, 'is_active', false));
end;
$$;

-- 2. Audit trigger on admin_users table
create or replace function log_admin_user_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into audit_log (
      actor_id, action, entity, entity_id, before, after
    ) values (
      v_actor_id, 'admin_user.created', 'admin_users', new.user_id::text,
      null,
      jsonb_build_object('role', new.role, 'display_name', new.display_name, 'is_active', new.is_active)
    );
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_log (
      actor_id, action, entity, entity_id, before, after
    ) values (
      v_actor_id, 'admin_user.updated', 'admin_users', new.user_id::text,
      jsonb_build_object('role', old.role, 'display_name', old.display_name, 'is_active', old.is_active),
      jsonb_build_object('role', new.role, 'display_name', new.display_name, 'is_active', new.is_active)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_log (
      actor_id, action, entity, entity_id, before, after
    ) values (
      v_actor_id, 'admin_user.deleted', 'admin_users', old.user_id::text,
      jsonb_build_object('role', old.role, 'display_name', old.display_name, 'is_active', old.is_active),
      null
    );
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_audit_admin_users on admin_users;
create trigger trg_audit_admin_users
  after insert or update or delete on admin_users
  for each row execute function log_admin_user_changes();
