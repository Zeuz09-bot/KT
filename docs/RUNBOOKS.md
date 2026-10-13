# Keraunous Tech Store — Production Incident Runbooks

This manual contains step-by-step procedures for the 6 primary operational incidents defined in **Blueprint §15.4 (Incident runbooks)**.

---

## Runbook 1: Site Down / Health Check Failing

### Trigger
- `/api/health` returns HTTP 503 or 500.
- Uptime robot or BetterStack reports downtime.
- Next.js or Supabase connection timeouts.

### Diagnostics
1. **Probe `/api/health` endpoint**:
   ```bash
   curl -i https://keraunous.ng/api/health
   ```
   Inspect the response:
   - If `status: "degraded"` and `database: "unhealthy"`: Supabase connection issue.
   - If connection timed out or Cloudflare 502/504: Next.js edge/server container crashed.
2. **Check Supabase Status Dashboard**:
   - Visit https://status.supabase.com
   - Check Supabase project compute, connection pooler (port 6543) status, and disk IOPS.
3. **Check Vercel / Hosting Logs**:
   - Inspect runtime logs for unhandled exceptions or OOM kills.

### Remediation
- **If Supabase pooler is exhausted**:
  1. Restart pooler in Supabase dashboard > Settings > Database > Network Restrictions / Connection Pooling.
  2. Verify that long-running transactions are not stuck (`SELECT * FROM pg_stat_activity WHERE state = 'active';`).
- **If Next.js container has crashed**:
  1. Roll back the deployment via hosting platform to previous green SHA.
  2. If redeploying, verify environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Post-Incident**:
  - File post-mortem, review connection leak logs, and adjust pool allocation.

---

## Runbook 2: Order Spam / Malicious Order Floods

### Trigger
- Sudden spike in pending orders (> 20/min from automated scripts).
- Telegram channel flooded with order alerts.
- Owner WhatsApp flooded with suspicious customer messages.

### Diagnostics
1. **Inspect recent orders and IP hashes in admin panel or database**:
   ```sql
   SELECT ip_hash, COUNT(*) as attempt_count, MIN(created_at), MAX(created_at)
   FROM orders
   WHERE created_at > NOW() - INTERVAL '30 minutes'
   GROUP BY ip_hash
   ORDER BY attempt_count DESC
   LIMIT 10;
   ```
2. **Inspect the `blocklist` and `audit_log` tables**.

### Remediation
1. **Block Malicious IP Hashes or Phone Numbers**:
   - In Supabase SQL Editor:
     ```sql
     INSERT INTO blocklist (type, value, reason)
     VALUES ('ip_hash', '<offending_ip_hash>', 'Order spam script flood')
     ON CONFLICT DO NOTHING;
     ```
   - All subsequent requests from this IP receive HTTP 403 `BLOCKED` immediately.
2. **Tighten Cloudflare Turnstile Verification**:
   - Ensure Cloudflare Turnstile managed challenge is set to "Interactive" under Cloudflare Security Settings.
3. **Cancel Spammed Orders**:
   - Bulk transition spammed orders to `CANCELLED` status with note: `"Automated spam mitigation"`.

---

## Runbook 3: Pricing Error / Accidental Zero or Wrong Price

### Trigger
- Product variant published with accidental incorrect price (e.g. ₦150,000 instead of ₦1,500,000).
- Incoming orders reflect the wrong price.

### Diagnostics
1. **Locate affected product and variant**:
   ```sql
   SELECT pv.id, p.title, pv.name, pv.price_ngn, pv.stock_quantity
   FROM product_variants pv
   JOIN products p ON pv.product_id = p.id
   WHERE pv.price_ngn < 50000; -- Example threshold
   ```

### Remediation
1. **Immediate Quarantine**:
   - Unpublish the product or set variant stock to 0 immediately to prevent new checkout submissions:
     ```sql
     UPDATE products SET is_published = false WHERE id = '<product_id>';
     ```
2. **Correct Variant Price**:
   - Update variant to correct Naira integer:
     ```sql
     UPDATE product_variants SET price_ngn = 1500000 WHERE id = '<variant_id>';
     UPDATE products SET is_published = true WHERE id = '<product_id>';
     ```
   - Client sessions holding the old price will receive HTTP 409 `PRICE_CHANGED` upon checkout, preventing fraudulent orders.
3. **Audit Unconfirmed Orders**:
   - Query orders created during the error window:
     ```sql
     SELECT id, order_code, total_price_ngn, status FROM orders
     WHERE created_at > '<error_window_start>' AND status = 'PENDING';
     ```
   - Inform owner to reject / decline affected WhatsApp messages. Transition orders to `CANCELLED` with note `"Pricing error remediation"`.

---

## Runbook 4: Compromised Staff Account

### Trigger
- Staff user reports stolen credentials, phishing, or unauthorized admin logins.
- Suspicious orders or products edited in `audit_log`.

### Diagnostics
1. **Inspect Audit Log for unauthorized actions**:
   ```sql
   SELECT * FROM audit_log
   WHERE admin_id = '<compromised_admin_user_id>'
   ORDER BY created_at DESC LIMIT 50;
   ```

### Remediation
1. **Deactivate Admin User Immediately**:
   ```sql
   UPDATE admin_users
   SET is_active = false
   WHERE id = '<compromised_admin_user_id>';
   ```
   - Every server action and data fetch checks `admin_users.is_active = true`. Deactivation terminates access immediately.
2. **Revoke Supabase Auth Session**:
   - In Supabase Auth dashboard > Users > Find user > Delete or Revoke Sessions.
3. **Audit and Revert Changes**:
   - Inspect products, prices, or orders changed by this user during the breach window. Revert data as required.

---

## Runbook 5: Secret / API Key Leak

### Trigger
- GitHub secret scanning alert or accidental commit containing `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, or `TELEGRAM_BOT_TOKEN`.

### Remediation
1. **Rotate Leaked Credential Immediately**:
   - **Supabase Service Role Key**: Supabase Dashboard > Settings > API > Rotate service_role secret.
   - **Telegram Bot Token**: Message `@BotFather` on Telegram > `/revoke` > Generate new token.
   - **Cron Secret**: Generate new 64-char random hex string (`node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).
2. **Update Hosting Environment Variables**:
   - Update secret in Vercel / hosting platform settings. Trigger immediate redeploy.
3. **Verify Git History**:
   - Confirm secret was not committed to public branch. If committed, use `git filter-repo` or BFG to purge commit history before pushing.

---

## Runbook 6: Data Loss & Recovery (Backup Restore Drill)

### Trigger
- Accidental catastrophic table drop, corruption, or regular recovery testing drill.

### Procedure
1. **Locate Latest Snapshot**:
   - Check `backups/` directory for latest `backup-YYYY-MM-DD-HHmmss/`.
2. **Verify Integrity**:
   - Read `manifest.json` and verify table SHA-256 hashes against dumped `.json` files.
3. **Execute Table Restore in Isolated Sandbox**:
   - Test restoration into staging / dev database before touching production:
   - For Supabase Point-In-Time-Recovery (PITR): Supabase Dashboard > Database > Backups > Restore to Point in Time.
   - For snapshot restore: Load JSON rows via admin script into target tables matching foreign key dependency order:
     `brands` -> `categories` -> `products` -> `product_variants` -> `product_specs` -> `system_settings`.
4. **Post-Restore Verification**:
   - Verify catalogue count, active variants, and run `/api/health` check.
