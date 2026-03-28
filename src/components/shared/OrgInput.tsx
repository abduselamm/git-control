"use client";

import { useState } from "react";
import { Building2, Search, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";

interface Props {
  org: string;
  setOrg: (v: string) => void;
}

export function OrgInput({ org, setOrg }: Props) {
  const { platform } = useAppStore();
  const [isFocused, setIsFocused] = useState(false);

  const placeholder = platform === "github" 
    ? "Organization namespace (e.g. vercel)" 
    : "Group path (e.g. gitlab-org)";

  return (
    <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.01] premium-shadow z-10' : ''}`}>
      <div 
        className="absolute -inset-0.5 rounded-2xl blur-md opacity-20 transition duration-300"
        style={{ 
          background: isFocused 
            ? `linear-gradient(90deg, var(--accent-${platform === "github" ? "github" : "gitlab"}), var(--accent-purple))` 
            : 'transparent' 
        }} 
      />
      <div
        className="relative flex items-center gap-3 p-4 rounded-xl border bg-[var(--bg-secondary)]"
        style={{ borderColor: isFocused ? "var(--border-hover)" : "var(--border)" }}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          style={{ 
            background: isFocused ? "var(--bg-primary)" : "var(--bg-tertiary)",
            border: "1px solid var(--border)"
          }}
        >
          {isFocused ? <Search size={18} style={{ color: "var(--text-primary)" }} /> : <Building2 size={18} style={{ color: "var(--text-muted)" }} />}
        </div>
        
        <input
          id="org-input"
          type="text"
          value={org}
          onChange={(e) => setOrg(e.target.value.trim())}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[16px] font-mono tracking-tight placeholder:text-zinc-600 focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        
        {org && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium shrink-0" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--accent-green)" }}>
            <CheckCircle2 size={13} />
            Target Active
          </div>
        )}
      </div>
    </div>
  );
}
