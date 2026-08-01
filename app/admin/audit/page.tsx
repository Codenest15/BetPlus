"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { getAdminAuditLog, type AdminAuditEntry } from "@/lib/admin-store";

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);

  useEffect(() => {
    setEntries(getAdminAuditLog());
  }, []);

  return (
    <AdminGate>
      <div className="space-y-4">
        <div>
          <h1 className="page-title">Audit log</h1>
          <p className="text-xs text-muted">
            Record of admin actions on this device (demo local storage).
          </p>
        </div>

        <div className="card overflow-hidden">
          {entries.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">
              No admin actions logged yet.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-brand-light/50 text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60">
                    <td className="whitespace-nowrap px-3 py-2 text-muted">
                      {new Date(entry.at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium">{entry.action}</td>
                    <td className="px-3 py-2">
                      {entry.detail}
                      {entry.bookingCode && (
                        <span className="ml-1 text-muted">
                          · {entry.bookingCode}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminGate>
  );
}
