"use client";

import { motion } from "framer-motion";
import { Trash2, Pencil, ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Webhook } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useStore";

interface Props {
  rows: Webhook[];
  onEdit?: (row: Webhook) => void;
  onDelete?: (id: number | string) => void;
  loading?: boolean;
  emptyLabel?: string;
}

export function WebhookTable({ rows, onEdit, onDelete, loading, emptyLabel }: Props) {
  const platform = useAppStore((s) => s.platform);
  const accent = platform === "github" ? "var(--text-primary)" : "var(--accent-gitlab)";

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "var(--border-hover)", background: "rgba(255,255,255,0.01)" }}>
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>{emptyLabel ?? "No webhooks found"}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl glass-panel relative z-10 premium-shadow">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border)` }}>
            <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Status</th>
            <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Payload URL</th>
            <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Events</th>
            <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Created</th>
            <th className="px-6 py-4 text-right font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, idx) => (
            <motion.tr
              key={row.id || row.url}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
              className="group transition-colors hover:bg-white/[0.03] backdrop-blur-sm"
            >
              <td className="px-6 py-5">
                {row.active ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                    <CheckCircle2 size={14} /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <XCircle size={14} /> Inactive
                  </span>
                )}
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-[13px] truncate max-w-[300px]" style={{ color: accent }}>{row.url}</span>
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={12} className="text-[var(--text-muted)] hover:text-white" />
                    </a>
                  </div>
                  {row.contentType && (
                     <span className="text-[10px] uppercase tracking-tighter opacity-50 font-bold" style={{ color: "var(--text-muted)" }}>{row.contentType}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                  {row.events.map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      {ev.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
                  <Clock size={12} />
                  {formatDate(row.createdAt)}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="p-2 rounded-xl transition-all hover:bg-white/10 hover:text-white"
                      style={{ color: "var(--text-muted)" }}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row.id!)}
                      className="p-2 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-500"
                      style={{ color: "var(--text-muted)" }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
