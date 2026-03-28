"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Platform, Repository, ConnectionStatus } from "@/lib/types";

interface TokenConfig {
  github: string;
  gitlab: string;
  githubApiBase: string;
  gitlabApiBase: string;
}

interface AppState {
  // ─── Platform ───────────────────────────────
  platform: Platform;
  setPlatform: (p: Platform) => void;

  // ─── Tokens ─────────────────────────────────
  tokens: TokenConfig;
  setToken: (platform: "github" | "gitlab", token: string) => void;
  setApiBase: (platform: "github" | "gitlab", base: string) => void;

  // ─── Connection Status ───────────────────────
  connectionStatus: Record<Platform, ConnectionStatus>;
  setConnectionStatus: (platform: Platform, status: ConnectionStatus) => void;

  // ─── Repository Selection ────────────────────
  selectedRepos: Repository[];
  toggleRepoSelection: (repo: Repository) => void;
  clearRepoSelection: () => void;
  setSelectedRepos: (repos: Repository[]) => void;

  // ─── Org / Group ─────────────────────────────
  activeOrg: string;
  setActiveOrg: (org: string) => void;

  // ─── Sidebar ─────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Platform
      platform: "github",
      setPlatform: (p) => set({ platform: p }),

      // Tokens
      tokens: {
        github: "",
        gitlab: "",
        githubApiBase: "/api/proxied/github",
        gitlabApiBase: "/api/proxied/gitlab",
      },
      setToken: (platform, token) =>
        set((s) => ({
          tokens: { ...s.tokens, [platform]: token },
        })),
      setApiBase: (platform, base) =>
        set((s) => ({
          tokens: {
            ...s.tokens,
            [`${platform}ApiBase`]: base,
          },
        })),

      // Connection
      connectionStatus: { github: "disconnected", gitlab: "disconnected" },
      setConnectionStatus: (platform, status) =>
        set((s) => ({
          connectionStatus: { ...s.connectionStatus, [platform]: status },
        })),

      // Repos
      selectedRepos: [],
      toggleRepoSelection: (repo) =>
        set((s) => {
          const exists = s.selectedRepos.some((r) => r.fullName === repo.fullName);
          return {
            selectedRepos: exists
              ? s.selectedRepos.filter((r) => r.fullName !== repo.fullName)
              : [...s.selectedRepos, repo],
          };
        }),
      clearRepoSelection: () => set({ selectedRepos: [] }),
      setSelectedRepos: (repos) => set({ selectedRepos: repos }),

      // Org
      activeOrg: "",
      setActiveOrg: (org) => set({ activeOrg: org }),

      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "git-control-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        platform: s.platform,
        tokens: s.tokens,
        activeOrg: s.activeOrg,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    }
  )
);
