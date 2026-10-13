-- =====================================================================
-- Keraunous Tech Store — Migration 007: Blocklist and Owner Security Alerts
-- Blueprint: Section 7.2, Section 10 (Unit U15), Section 12
-- =====================================================================

-- 1. BLOCKLIST TABLE (§7.2)
-- Used to restrict abusive phones or hashed IPs from submitting orders
create table if not exists blocklist (
  id         bigserial primary key,
  kind       text not null check (kind in ('phone', 'ip_hash')),
  value      text not null,
  reason     text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (kind, value)
);

create index if not exists ix_blocklist_kind_value on blocklist(kind, value);

-- Row Level Security for blocklist
alter table blocklist enable row level security;

-- Admin users (staff and owner) can read the blocklist
create policy "Admin read blocklist" on blocklist
  for select using (is_admin());

-- Admin users can insert into blocklist
create policy "Admin insert blocklist" on blocklist
  for insert with check (is_admin());

-- Only owner can update or delete blocklist entries
create policy "Owner modify blocklist" on blocklist
  for all using (is_owner());

-- 2. OWNER SECURITY ALERTS TABLE (U15 item 7)
-- Records high-priority security and operational alerts for owner review and dispatch
create table if not exists owner_alerts (
  id         bigserial primary key,
  type       text not null check (type in ('whatsapp_changed', 'new_staff', 'repeated_failed_logins', 'security_breach', 'system')),
  severity   text not null check (severity in ('info', 'warning', 'critical')),
  title      text not null,
  message    text not null,
  meta       jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ix_owner_alerts_created on owner_alerts(created_at desc);

-- Row Level Security for owner_alerts (Strictly Owner-only)
alter table owner_alerts enable row level security;

-- Only owner can read alerts
create policy "Owner read alerts" on owner_alerts
  for select using (is_owner());

-- Only owner or internal security routines can manage alerts
create policy "Owner modify alerts" on owner_alerts
  for all using (is_owner());
