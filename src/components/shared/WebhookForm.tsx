"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Globe, Shield, Activity } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";
import type { Webhook } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Webhook;
  loading?: boolean;
  mode: "create" | "edit";
}

const COMMON_EVENTS = [
  { id: "push", label: "Push Events" },
  { id: "issues", label: "Issues" },
  { id: "merge_requests", label: "Merge/Pull Requests" },
  { id: "tag_push", label: "Tag Push" },
  { id: "note", label: "Comments/Notes" },
  { id: "job", label: "CI Jobs" },
  { id: "pipeline", label: "Pipelines" },
  { id: "wiki_page", label: "Wiki Changes" },
];

export function WebhookForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  mode,
}: Props) {
  const { platform } = useAppStore();

  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [contentType, setContentType] = useState<"json" | "form">("json");
  const [insecureSsl, setInsecureSsl] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["push"]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUrl(initialData.url);
        setSecret(""); // Secrets are write-only
        setContentType(initialData.contentType || "json");
        setInsecureSsl(!!initialData.insecureSsl);
        setSelectedEvents(initialData.events || ["push"]);
      } else {
        setUrl("");
        setSecret("");
        setContentType("json");
        setInsecureSsl(false);
        setSelectedEvents(["push"]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // For GitHub, we map 'merge_requests' to 'pull_request' if we want to be precise, 
    // but the API client should handle this ideally.
    // However, to be safe, let's pass the array as is.
    
    await onSubmit({
      url,
      secret: secret || undefined,
      contentType,
      insecureSsl,
      events: selectedEvents,
    });
  }

  function toggleEvent(id: string) {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  const title = `${mode === "create" ? "New" : "Edit"} Webhook`;
  const accentColor = platform === "github" ? "var(--accent-github)" : "var(--accent-gitlab)";
  const bgAccent = platform === "github" ? "var(--text-primary)" : "var(--accent-gitlab)";
  const textAccent = platform === "github" ? "var(--bg-primary)" : "#fff";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={loading ? undefined : onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl rounded-2xl border premium-shadow my-auto"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Globe size={18} className="text-blue-400" /> {title}
            </h2>
            <button onClick={onClose} disabled={loading} className="p-1.5 rounded-full hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Payload URL</label>
                <input
                  autoFocus
                  required
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-2.5 rounded-xl font-mono text-sm transition-all focus:outline-none"
                  style={{ background: "var(--bg-tertiary)", border: `1px solid var(--border)`, color: "var(--text-primary)" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none appearance-none"
                    style={{ background: "var(--bg-tertiary)", border: `1px solid var(--border)`, color: "var(--text-primary)" }}
                  >
                    <option value="json">application/json</option>
                    {platform === "github" && <option value="form">application/x-www-form-urlencoded</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Secret (Optional)</label>
                  <input
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={mode === "edit" ? "••••••••" : "Webhook secret"}
                    className="w-full px-4 py-2.5 rounded-xl font-mono text-sm transition-all focus:outline-none"
                    style={{ background: "var(--bg-tertiary)", border: `1px solid var(--border)`, color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed" style={{ borderColor: "var(--border)" }}>
                  <input
                    type="checkbox"
                    id="ssl"
                    checked={insecureSsl}
                    onChange={(e) => setInsecureSsl(e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500"
                  />
                  <label htmlFor="ssl" className="text-sm cursor-pointer select-none" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-2">
                       <Shield size={14} className={insecureSsl ? "text-red-400" : "text-green-400"} />
                       Disable SSL Verification (Insecure)
                    </span>
                  </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <Activity size={16} /> Events to trigger this webhook
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
                {COMMON_EVENTS.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-3 cursor-pointer group p-1">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(ev.id)}
                      onChange={() => toggleEvent(ev.id)}
                      className="w-4 h-4 rounded transition-all cursor-pointer"
                      style={{ accentColor: accentColor }}
                    />
                    <span className="text-xs select-none transition-colors group-hover:text-white" style={{ color: "var(--text-muted)" }}>
                      {ev.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5" style={{ color: "var(--text-secondary)" }}>Cancel</button>
              <button
                type="submit"
                disabled={loading || !url || selectedEvents.length === 0}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: bgAccent, color: textAccent, boxShadow: `0 4px 14px color-mix(in srgb, ${accentColor} 30%, transparent)` }}
              >
                {loading ? <span className="animate-pulse">Saving...</span> : <><Save size={16} /> {mode === "create" ? "Create Webhook" : "Save Changes"}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
