"use client";
// Hotfix: Force re-sync of exports


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGitHubClient } from "@/lib/api/factory";
import { useGitLabClient } from "@/lib/api/factory";
import { useAppStore } from "@/lib/store/useStore";
import type { Variable, Repository } from "@/lib/types";

// ─────────────────────────────────────────────
// Repo Variables
// ─────────────────────────────────────────────
export function useRepoVariables(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["repo-variables", platform, owner, repo],
    queryFn: () =>
      platform === "github"
        ? github.listRepoVariables(owner, repo)
        : gitlab.listProjectVariables(`${owner}/${repo}`),
    enabled: !!owner && !!repo,
  });
}

export function useCreateRepoVariable(owner: string, repo: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: ({ key, value, masked }: { key: string; value: string; masked?: boolean }) =>
      platform === "github"
        ? github.createRepoVariable(owner, repo, key, value)
        : gitlab.createProjectVariable(`${owner}/${repo}`, key, value, masked),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["repo-variables", platform, owner, repo] }),
  });
}

export function useUpdateRepoVariable(owner: string, repo: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: ({ key, value, masked }: { key: string; value: string; masked?: boolean }) =>
      platform === "github"
        ? github.updateRepoVariable(owner, repo, key, value)
        : gitlab.updateProjectVariable(`${owner}/${repo}`, key, value, masked),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["repo-variables", platform, owner, repo] }),
  });
}

export function useDeleteRepoVariable(owner: string, repo: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: (key: string) =>
      platform === "github"
        ? github.deleteRepoVariable(owner, repo, key)
        : gitlab.deleteProjectVariable(`${owner}/${repo}`, key),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["repo-variables", platform, owner, repo] }),
  });
}

// ─────────────────────────────────────────────
// Repo Secrets (GitHub) / Masked Variables (GitLab)
// ─────────────────────────────────────────────
export function useRepoSecrets(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["repo-secrets", platform, owner, repo],
    queryFn: async () =>
      platform === "github"
        ? (await github.listRepoSecrets(owner, repo)) as any
        : (await gitlab.listProjectSecrets(`${owner}/${repo}`)) as any,
    enabled: !!owner && !!repo,
  });
}

export function useCreateOrUpdateRepoSecret(owner: string, repo: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      platform === "github"
        ? github.createOrUpdateRepoSecret(owner, repo, name, value)
        : gitlab.createProjectVariable(`${owner}/${repo}`, name, value, true),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["repo-secrets", platform, owner, repo] }),
  });
}

export function useDeleteRepoSecret(owner: string, repo: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: (name: string) =>
      platform === "github"
        ? github.deleteRepoSecret(owner, repo, name)
        : gitlab.deleteProjectVariable(`${owner}/${repo}`, name),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["repo-secrets", platform, owner, repo] }),
  });
}

// ─────────────────────────────────────────────
// Org / Group Variables
// ─────────────────────────────────────────────
export function useOrgVariables(org: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["org-variables", platform, org],
    queryFn: () =>
      platform === "github"
        ? github.listOrgVariables(org)
        : gitlab.listGroupVariables(org),
    enabled: !!org,
  });
}

export function useCreateOrgVariable(org: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: ({ key, value, masked, visibility }: { key: string; value: string; masked?: boolean; visibility?: "all" | "private" | "selected" }) =>
      platform === "github"
        ? github.createOrgVariable(org, key, value, visibility ?? "all")
        : gitlab.createGroupVariable(org, key, value, masked),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["org-variables", platform, org] }),
  });
}

export function useUpdateOrgVariable(org: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: ({ key, value, masked }: { key: string; value: string; masked?: boolean }) =>
      platform === "github"
        ? github.updateOrgVariable(org, key, value)
        : gitlab.updateGroupVariable(org, key, value, masked),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["org-variables", platform, org] }),
  });
}

export function useDeleteOrgVariable(org: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: (key: string) =>
      platform === "github"
        ? github.deleteOrgVariable(org, key)
        : gitlab.deleteGroupVariable(org, key),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["org-variables", platform, org] }),
  });
}

// ─────────────────────────────────────────────
// Org Secrets (GitHub) / Masked Group Vars (GitLab)
// ─────────────────────────────────────────────
export function useOrgSecrets(org: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["org-secrets", platform, org],
    queryFn: async () =>
      platform === "github"
        ? (await github.listOrgSecrets(org)) as any
        : (await gitlab.listGroupSecrets(org)) as any,
    enabled: !!org,
  });
}

export function useCreateOrUpdateOrgSecret(org: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: ({ name, value, visibility }: { name: string; value: string; visibility?: "all" | "private" | "selected" }) =>
      platform === "github"
        ? github.createOrUpdateOrgSecret(org, name, value, visibility ?? "all")
        : gitlab.createGroupVariable(org, name, value, true),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["org-secrets", platform, org] }),
  });
}

export function useDeleteOrgSecret(org: string) {
  const qc = useQueryClient();
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: (name: string) =>
      platform === "github"
        ? github.deleteOrgSecret(org, name)
        : gitlab.deleteGroupVariable(org, name),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["org-secrets", platform, org] }),
  });
}

// ─────────────────────────────────────────────
// Org All Repos
// ─────────────────────────────────────────────
export function useOrgRepos(org: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["org-repos", platform, org],
    queryFn: () =>
      platform === "github"
        ? github.listAllOrgRepos(org)
        : gitlab.listAllGroupProjects(org),
    enabled: !!org,
  });
}

// ─────────────────────────────────────────────
// Bulk propagation hook
// ─────────────────────────────────────────────
export function useBulkPropagateVariable() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({
      repos,
      key,
      value,
      masked,
    }: {
      repos: Repository[];
      key: string;
      value: string;
      masked?: boolean;
    }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          if (platform === "github") {
            try {
              await github.createRepoVariable(owner, repo, key, value);
            } catch {
              await github.updateRepoVariable(owner, repo, key, value);
            }
          } else {
            try {
              await gitlab.createProjectVariable(r.id, key, value, masked);
            } catch {
              await gitlab.updateProjectVariable(r.id, key, value, masked);
            }
          }
        })
      );
      return results;
    },
  });
}

export function useBulkPropagateSecret() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({
      repos,
      name,
      value,
    }: {
      repos: Repository[];
      name: string;
      value: string;
    }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          if (platform === "github") {
            await github.createOrUpdateRepoSecret(owner, repo, name, value);
          } else {
            try {
              await gitlab.createProjectVariable(r.id, name, value, true);
            } catch {
              await gitlab.updateProjectVariable(r.id, name, value, true);
            }
          }
        })
      );
      return results;
    },
  });
}

export function useBulkDeleteVariable() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({ repos, key }: { repos: Repository[]; key: string }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          try {
            return await (platform === "github"
              ? github.deleteRepoVariable(owner, repo, key)
              : gitlab.deleteProjectVariable(r.id, key));
          } catch (e: any) {
            if (e.response?.status === 404 || e.response?.status === 405) {
              return { skipped: true, message: "Item does not exist" };
            }
            throw e;
          }
        })
      );
      return results;
    },
  });
}

export function useBulkDeleteSecret() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({ repos, name }: { repos: Repository[]; name: string }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          try {
            return await (platform === "github"
              ? github.deleteRepoSecret(owner, repo, name)
              : gitlab.deleteProjectVariable(r.id, name));
          } catch (e: any) {
             if (e.response?.status === 404 || e.response?.status === 405) {
              return { skipped: true, message: "Item does not exist" };
            }
            throw e;
          }
        })
      );
      return results;
    },
  });
}



