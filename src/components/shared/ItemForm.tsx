"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";
import type { Variable, Secret } from "@/lib/types";

export interface ItemFormData {
  key: string;
  value: string;
  masked: boolean;
  protected: boolean;
  environment: string;
  visibility: "all" | "private" | "selected";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => Promise<void>;
  initialData?: Variable | Secret;
  loading?: boolean;
  mode: "create" | "edit";
  itemType: "variable" | "secret";
  isOrgLevel?: boolean;
}

export function ItemForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  mode,
  itemType,
  isOrgLevel,
}: Props) {
  const { platform } = useAppStore();

  const [formData, setFormData] = useState<ItemFormData>({
    key: "",
    value: "",
    masked: itemType === "secret", // default to masked if it's a secret
    protected: false,
    environment: "*",
    visibility: "all",
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          key: "key" in initialData ? initialData.key : (initialData as Secret).name,
          value: "key" in initialData ? initialData.value : "",
          masked: "masked" in initialData ? !!initialData.masked : itemType === "secret",
          protected: "protected" in initialData ? !!initialData.protected : false,
          environment: "environment" in initialData ? initialData.environment ?? "*" : "*",
          visibility: "visibility" in initialData ? initialData.visibility as any : "all",
        });
      } else {
        setFormData({
          key: "",
          value: "",
          masked: itemType === "secret",
          protected: false,
          environment: "*",
          visibility: "all",
        });
      }
    }
  }, [isOpen, initialData, itemType]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(formData);
  }

  const title = `${mode === "create" ? "New" : "Edit"} ${
    itemType === "variable" ? "Variable" : "Secret"
  }`;

  const accentColor = platform === "github" ? "var(--accent-github)" : "var(--accent-gitlab)";
  const bgAccent = platform === "github" ? "var(--text-primary)" : "var(--accent-gitlab)";
  const textAccent = platform === "github" ? "var(--bg-primary)" : "#fff";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={loading ? undefined : onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border premium-shadow"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-full transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {itemType === "variable" ? "Key" : "Name"}
              </label>
              <input
                autoFocus
                disabled={mode === "edit" || loading}
                type="text"
                value={formData.key}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    key: e.target.value.toUpperCase().replace(/\s/g, "_"),
                  })
                }
                placeholder="e.g. API_KEY"
                className="w-full px-4 py-2.5 rounded-xl font-mono text-sm transition-all focus:outline-none disabled:opacity-50"
                style={{ background: "var(--bg-tertiary)", border: `1px solid var(--border)`, color: "var(--text-primary)" }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Value
              </label>
              <textarea
                disabled={loading}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={mode === "edit" && itemType === "secret" ? "Leave blank to keep existing encrypted value..." : `Enter ${itemType} value...`}
                className="w-full h-24 px-4 py-3 rounded-xl font-mono text-sm resize-none transition-all focus:outline-none"
                style={{ background: "var(--bg-tertiary)", border: `1px solid var(--border)`, color: "var(--text-primary)" }}
                required={mode === "create"}
              />
            </div>

            <div className="space-y-4 pt-2">
              {/* GitLab Specifics (only for variables, since we treat masked vars as secrets) */}
              {platform === "gitlab" && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.masked}
                      onChange={(e) => setFormData({ ...formData, masked: e.target.checked })}
                      disabled={loading || itemType === "secret"}
                      className="w-4 h-4 rounded border-gray-600 focus:ring-opacity-50 transition-all cursor-pointer accent-[var(--accent-gitlab)]"
                    />
                    <span className="text-sm select-none transition-colors group-hover:text-white" style={{ color: "var(--text-secondary)" }}>Masked</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.protected}
                      onChange={(e) => setFormData({ ...formData, protected: e.target.checked })}
                      disabled={loading}
                      className="w-4 h-4 rounded border-gray-600 focus:ring-opacity-50 transition-all cursor-pointer accent-[var(--accent-gitlab)]"
                    />
                    <span className="text-sm select-none transition-colors group-hover:text-white" style={{ color: "var(--text-secondary)" }}>Protected</span>
                  </label>
                </div>
              )}

              {/* GitLab Environment (for both) */}
              {platform === "gitlab" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Environment Scope
                  </label>
                  <input
                    disabled={loading}
                    type="text"
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl font-mono text-sm transition-all focus:outline-none"
                    style={{ background: "var(--bg-tertiary)", border: `1px solid var(--border)`, color: "var(--text-primary)" }}
                  />
                  <p className="text-xs mt-1.5 opacity-60" style={{ color: "var(--text-muted)" }}>Use * for all environments.</p>
                </div>
              )}

              {/* GitHub Org-level Visibility */}
              {platform === "github" && isOrgLevel && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Visibility
                  </label>
                  <div className="flex gap-2 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
                    {["all", "private", "selected"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormData({ ...formData, visibility: v as any })}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                          formData.visibility === v ? "" : "hover:bg-white/5"
                        }`}
                        style={
                          formData.visibility === v
                            ? { background: "var(--border-hover)", color: "var(--text-primary)" }
                            : { color: "var(--text-secondary)" }
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {formData.visibility === "selected" && (
                    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--accent-yellow)" }}>
                      <AlertCircle size={14} />
                      Assign repositories via GitHub UI after creation.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-6 mt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.key}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: bgAccent, color: textAccent, boxShadow: `0 4px 14px color-mix(in srgb, ${accentColor} 30%, transparent)` }}
              >
                {loading ? <span className="animate-pulse">Saving...</span> : <><Save size={16} /> Save</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
