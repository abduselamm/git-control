"use client";

import { motion } from "framer-motion";
import { Trash2, Pencil, Copy, ChevronDown, ChevronUp } from "lucide-react";
import type { Variable, Secret } from "@/lib/types";
import { formatDate, maskValue } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/useStore";

type Row = Variable | Secret;

function isVariable(row: Row): row is Variable {
  return "key" in row;
}

interface Props {
  rows: Row[];
  type: "variable" | "secret";
  onEdit?: (row: Row) => void;
  onDelete?: (name: string) => void;
  loading?: boolean;
  emptyLabel?: string;
}

export function DataTable({ rows, type, onEdit, onDelete, loading, emptyLabel }: Props) {
  const platform = useAppStore((s) => s.platform);
  const [sortKey, setSortKey] = useState<"name" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const accent = platform === "github" ? "var(--text-primary)" : "var(--accent-gitlab)";

  function toggleSort(key: "name" | "date") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    const aName = isVariable(a) ? a.key : (a as Secret).name;
    const bName = isVariable(b) ? b.key : (b as Secret).name;
    const aDate = isVariable(a) ? a.updatedAt : (a as Secret).updatedAt;
    const bDate = isVariable(b) ? b.updatedAt : (b as Secret).updatedAt;

    let cmp = 0;
    if (sortKey === "name") cmp = aName.localeCompare(bName);
    else cmp = (aDate ?? "").localeCompare(bDate ?? "");
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed" style={{ borderColor: "var(--border-hover)", background: "rgba(255,255,255,0.01)" }}>
        <p className="text-[14px]" style={{ color: "var(--text-muted)" }}>{emptyLabel ?? "No items found"}</p>
      </div>
    );
  }

  function SortIcon({ col }: { col: "name" | "date" }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl glass-panel relative z-10 premium-shadow">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border)` }}>
            <th
              className="px-6 py-4 text-left font-medium cursor-pointer transition-colors hover:bg-white/5 select-none text-xs tracking-wider uppercase"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => toggleSort("name")}
            >
              <span className="flex items-center">
                {type === "variable" ? "Key" : "Name"} <SortIcon col="name" />
              </span>
            </th>
            {type === "variable" && (
              <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>
                Value
              </th>
            )}
            {platform === "gitlab" && type === "variable" && (
              <>
                <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Masked</th>
                <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Protected</th>
                <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Env</th>
              </>
            )}
            {platform === "github" && (
              <th className="px-6 py-4 text-left font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>Visibility</th>
            )}
            <th
              className="px-6 py-4 text-left font-medium cursor-pointer transition-colors hover:bg-white/5 select-none text-xs tracking-wider uppercase"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => toggleSort("date")}
            >
              <span className="flex items-center">Updated <SortIcon col="date" /></span>
            </th>
            <th className="px-6 py-4 text-right font-medium text-xs tracking-wider uppercase" style={{ color: "var(--text-secondary)" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {sorted.map((row, idx) => {
            const name = isVariable(row) ? row.key : (row as Secret).name;
            const value = isVariable(row) ? row.value : undefined;
            const updatedAt = isVariable(row) ? row.updatedAt : (row as Secret).updatedAt;

            return (
              <motion.tr
                key={name}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02, duration: 0.2 }}
                className="group transition-colors hover:bg-white/[0.03] backdrop-blur-sm"
              >
                <td className="px-6 py-4 font-mono font-medium text-[13px]" style={{ color: accent }}>
                  {name}
                </td>
                {type === "variable" && (
                  <td className="px-6 py-4 font-mono text-[13px]" style={{ color: "var(--text-secondary)", maxWidth: 240 }}>
                    <div className="flex items-center gap-3">
                      <span className="truncate">{isVariable(row) && row.masked ? maskValue(value ?? "") : value}</span>
                      {value && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied to clipboard!"); }}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                          style={{ color: "var(--text-muted)" }}
                          title="Copy value"
                        >
                          <Copy size={13} className="hover:text-white transition-colors" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
                {platform === "gitlab" && type === "variable" && isVariable(row) && (
                  <>
                    <td className="px-6 py-4">
                      <Badge active={!!row.masked} label={row.masked ? "Yes" : "No"} color={row.masked ? "var(--accent-purple)" : "var(--text-muted)"} />
                    </td>
                    <td className="px-6 py-4">
                      <Badge active={!!row.protected} label={row.protected ? "Yes" : "No"} color={row.protected ? "var(--accent-yellow)" : "var(--text-muted)"} />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      {row.environment ?? "*"}
                    </td>
                  </>
                )}
                {platform === "github" && (
                  <td className="px-6 py-4">
                    {isVariable(row) && row.visibility ? (
                      <Badge active label={row.visibility} color="var(--accent-github)" />
                    ) : !isVariable(row) && (row as Secret).visibility ? (
                      <Badge active label={(row as Secret).visibility!} color="var(--accent-github)" />
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
                  {formatDate(updatedAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && type === "variable" && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg transition-all hover:bg-white/10 hover:text-white"
                        style={{ color: "var(--text-muted)" }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(name)}
                        className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-500"
                        style={{ color: "var(--text-muted)" }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ active, label, color }: { active: boolean; label: string; color: string }) {
  if (!active) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.03)" }}>
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide capitalize"
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        boxShadow: `0 0 10px color-mix(in srgb, ${color} 20%, transparent)`
      }}
    >
      {label}
    </span>
  );
}
