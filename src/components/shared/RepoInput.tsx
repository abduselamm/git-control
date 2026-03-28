"use client";

import { useState } from "react";
import { GitBranch, ChevronRight, Search } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";

interface Props {
  owner: string;
  repo: string;
  setOwner: (v: string) => void;
  setRepo: (v: string) => void;
}

export function RepoInput({ owner, repo, setOwner, setRepo }: Props) {
  const { platform } = useAppStore();
  const [combined, setCombined] = useState(owner && repo ? `${owner}/${repo}` : "");
  const [isFocused, setIsFocused] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCombined(val);
    const parts = val.split("/");
    if (parts.length >= 2 && parts[1].length > 0) {
      setOwner(parts[0].trim());
      setRepo(parts.slice(1).join("/").trim());
    } else {
      setOwner("");
      setRepo("");
    }
  }

  const placeholder = platform === "github" 
    ? "owner/repository (e.g. vercel/next.js)" 
    : "namespace/project (e.g. gitlab-org/gitlab)";

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
          {isFocused ? <Search size={18} style={{ color: "var(--text-primary)" }} /> : <GitBranch size={18} style={{ color: "var(--text-muted)" }} />}
        </div>
        
        <input
          id="repo-input"
          type="text"
          value={combined}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[16px] font-mono tracking-tight placeholder:text-zinc-600 focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        
        {owner && repo && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-mono shrink-0 badge-glow" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-hover)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{owner}</span>
            <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{repo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
