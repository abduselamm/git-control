"use client";

import { useState } from "react";
import { Save, Building2, Zap, Server, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/useStore";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { tokens, setToken, setApiBase, platform } = useAppStore();
  const queryClient = useQueryClient();
  
  const [ghToken, setGhToken] = useState(tokens.github || "");
  const [glToken, setGlToken] = useState(tokens.gitlab || "");
  const [glUrl, setGlUrl] = useState(tokens.gitlabApiBase || "https://gitlab.com");

  const handleSave = () => {
    setToken("github", ghToken.trim() || "");
    setToken("gitlab", glToken.trim() || "");
    
    const formattedGlUrl = glUrl.trim().replace(/\/$/, "");
    setApiBase("gitlab", formattedGlUrl || "https://gitlab.com");
    
    queryClient.clear();
    toast.success("Settings saved successfully");
  };

  return (
    <div className="flex-1 space-y-6 fade-in max-w-4xl mx-auto w-full pt-2">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Platform Settings</h2>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">
          Configure authentication tokens and API overrides. Tokens are stored locally in your browser.
        </p>
      </div>

      <div className="saas-card overflow-hidden">
        <div className="saas-card-header bg-[hsl(var(--muted))] border-b p-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[hsl(var(--foreground))]" />
            <h3 className="font-semibold text-base">GitHub Configuration</h3>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Requires scopes: <code className="bg-[hsl(var(--background))] px-1.5 py-0.5 rounded text-[hsl(var(--foreground))]">repo</code>, <code className="bg-[hsl(var(--background))] px-1.5 py-0.5 rounded text-[hsl(var(--foreground))]">admin:org</code>
          </p>
        </div>
        <div className="saas-card-content p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Personal Access Token</label>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              spellCheck={false}
              className="w-full px-4 py-2 rounded-md font-mono text-sm border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--foreground))]"
            />
          </div>
          <div className="flex bg-[hsl(var(--muted))/50] p-4 rounded-lg border items-start gap-3">
            <Settings size={18} className="mt-0.5 text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              GitHub API requests are routed through a local Next.js proxy <code className="text-xs bg-[hsl(var(--background))] px-1 rounded">/api/proxied/github</code> to safely handle CORS and preflights without exposing tokens to external proxy servers.
            </p>
          </div>
        </div>
      </div>

      <div className="saas-card overflow-hidden">
        <div className="saas-card-header bg-[hsl(var(--muted))] border-b p-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} style={{ color: "var(--accent-gitlab)" }} />
            <h3 className="font-semibold text-base">GitLab Configuration</h3>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Requires scope: <code className="bg-[hsl(var(--background))] px-1.5 py-0.5 rounded text-[hsl(var(--foreground))]">api</code>
          </p>
        </div>
        <div className="saas-card-content p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Personal Access Token</label>
            <input
              type="password"
              value={glToken}
              onChange={(e) => setGlToken(e.target.value)}
              placeholder="glpat-xxxxxxxxxxxxxxxxxx"
              spellCheck={false}
              className="w-full px-4 py-2 rounded-md font-mono text-sm border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gitlab)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">API Base URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[hsl(var(--muted-foreground))]">
                <Server size={16} />
              </div>
              <input
                type="url"
                value={glUrl}
                onChange={(e) => setGlUrl(e.target.value)}
                placeholder="https://gitlab.com"
                className="w-full pl-10 pr-4 py-2 rounded-md font-mono text-sm border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gitlab)]"
              />
            </div>
            <p className="text-xs mt-2 text-[hsl(var(--muted-foreground))]">
              Change this if you are using a self-hosted GitLab instance (e.g., https://gitlab.internal.company.com).
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 pb-12">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: platform === "github" ? "hsl(var(--foreground))" : "var(--accent-gitlab)", color: platform === "github" ? "hsl(var(--background))" : "#fff" }}
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
}
