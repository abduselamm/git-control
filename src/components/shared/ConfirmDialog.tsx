"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="w-full max-w-sm rounded-xl p-6 shadow-2xl"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                {danger && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(248, 81, 73, 0.15)" }}
                  >
                    <AlertTriangle size={16} style={{ color: "var(--accent-red)" }} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {message}
                  </p>
                </div>
                <button onClick={onCancel} style={{ color: "var(--text-muted)" }}>
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                  style={
                    danger
                      ? { background: "var(--accent-red)", color: "#fff" }
                      : { background: "var(--accent-github)", color: "#0d1117" }
                  }
                >
                  {loading ? "Working…" : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
