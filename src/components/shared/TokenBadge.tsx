"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Wifi } from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";
import { GitHubAPI } from "@/lib/api/github";
import { GitLabAPI } from "@/lib/api/gitlab";

export function TokenBadge() {
  const { platform, tokens, connectionStatus, setConnectionStatus } = useAppStore();
  const [checking, setChecking] = useState(false);

  const token = platform === "github" ? tokens.github : tokens.gitlab;
  const status = connectionStatus[platform];

  async function checkConnection() {
    if (!token) return;
    setChecking(true);
    setConnectionStatus(platform, "checking");
    try {
      if (platform === "github") {
        const api = new GitHubAPI(token, tokens.githubApiBase);
        await api.getAuthUser();
      } else {
        const api = new GitLabAPI(token, tokens.gitlabApiBase);
        await api.getAuthUser();
      }
      setConnectionStatus(platform, "connected");
    } catch {
      setConnectionStatus(platform, "error");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (token && status === "disconnected") {
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, platform]);

  if (!token) {
    return (
      <span
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        <Wifi size={11} />
        No Token
      </span>
    );
  }

  const icons: Record<string, React.ReactNode> = {
    connected: <CheckCircle2 size={11} style={{ color: "var(--accent-green)" }} />,
    error: <XCircle size={11} style={{ color: "var(--accent-red)" }} />,
    checking: <RefreshCw size={11} className="animate-spin" style={{ color: "var(--accent-yellow)" }} />,
    disconnected: <RefreshCw size={11} style={{ color: "var(--text-muted)" }} />,
  };

  const colors: Record<string, string> = {
    connected: "var(--accent-green)",
    error: "var(--accent-red)",
    checking: "var(--accent-yellow)",
    disconnected: "var(--text-muted)",
  };

  return (
    <button
      onClick={checkConnection}
      disabled={checking}
      className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors hover:bg-white/5"
      style={{
        background: "var(--bg-tertiary)",
        color: colors[status],
        border: "1px solid var(--border)",
      }}
      title="Click to re-verify connection"
      id="token-badge"
    >
      {icons[status]}
      <span className="capitalize">{status === "connected" ? "Connected" : status === "error" ? "Auth Error" : status}</span>
    </button>
  );
}
