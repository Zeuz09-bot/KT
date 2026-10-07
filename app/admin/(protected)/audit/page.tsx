import React from 'react';
import type { Metadata } from 'next';
import { requireOwner } from '@/modules/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { formatLagosTime } from '@/lib/dates';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Audit Log | Keraunous Admin',
};

export default async function AdminAuditPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Security & Audit Log
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Immutable audit trail for authentication, staff changes, pricing adjustments, and critical operations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          Failed to fetch audit log entries: {error.message}
        </div>
      )}

      <div className="bg-white border border-border-default rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-text-secondary border-b border-border-default text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {(!logs || logs.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-text-secondary font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {formatLagosTime(entry.created_at)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Badge
                        variant="generic"
                        className="font-mono text-[11px] bg-neutral-100 text-neutral-800"
                      >
                        {entry.action}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-text-secondary font-mono">
                      <span className="font-semibold text-text-primary">{entry.entity}</span>
                      {entry.entity_id && (
                        <span className="text-text-muted text-[11px] block truncate max-w-[120px]">
                          {entry.entity_id}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-text-muted">
                      {entry.actor_id ? `${entry.actor_id.slice(0, 8)}...` : 'System / Anon'}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      {entry.after || entry.before ? (
                        <details className="cursor-pointer group">
                          <summary className="text-accent-orange font-medium hover:underline text-[11px]">
                            View Payload
                          </summary>
                          <pre className="mt-2 p-2 bg-neutral-900 text-neutral-100 rounded text-[10px] font-mono overflow-x-auto max-w-md">
                            {JSON.stringify(
                              {
                                before: entry.before,
                                after: entry.after,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-text-muted text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
