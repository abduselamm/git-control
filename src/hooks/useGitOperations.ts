"use client";
// Hotfix: Force re-sync of exports


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGitHubClient } from "@/lib/api/factory";
import { useGitLabClient } from "@/lib/api/factory";
import { useAppStore } from "@/lib/store/useStore";
import type { Variable, Repository } from "@/lib/types";
import { normalizeUrl } from "@/lib/utils";

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
      oldKey,
      value,
      masked,
    }: {
      repos: Repository[];
      key: string;
      oldKey?: string;
      value: string;
      masked?: boolean;
    }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          const searchKey = oldKey || key;
          if (platform === "github") {
            try {
              // Try to update the original key first
              await github.updateRepoVariable(owner, repo, searchKey, value);
              // If key name changed, if github doesn't support rename, we might need delete/create. 
              // Wait, GitHub API allows renaming by passing `{ name: newName }` in the body but patch path uses oldName. 
              // Let us assume github.updateRepoVariable uses `name` body for the new name.
            } catch {
              await github.createRepoVariable(owner, repo, key, value);
            }
          } else {
            try {
              await gitlab.updateProjectVariable(r.id, searchKey, value, masked);
            } catch {
              await gitlab.createProjectVariable(r.id, key, value, masked);
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

// ─────────────────────────────────────────────
// Repo Webhooks
// ─────────────────────────────────────────────
export function useRepoWebhooks(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["repo-webhooks", platform, owner, repo],
    queryFn: () =>
      platform === "github"
        ? github.listRepoWebhooks(owner, repo)
        : gitlab.listProjectHooks(`${owner}/${repo}`),
    enabled: !!owner && !!repo,
  });
}

export function useBulkPropagateWebhook() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({
      repos,
      url,
      oldUrl,
      secret,
      contentType,
      insecureSsl,
      events,
    }: {
      repos: Repository[];
      url: string;
      oldUrl?: string;
      secret?: string;
      contentType?: "json" | "form";
      insecureSsl?: boolean;
      events?: string[];
    }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, name] = r.fullName.split("/");
          const id = r.id;

          try {
            // 1. Check for existing hook with same URL or old URL
            const existing =
              platform === "github"
                ? await github.listRepoWebhooks(owner, name)
                : await gitlab.listProjectHooks(id);

            const searchUrl = normalizeUrl(oldUrl || url);
            const match = existing.find((h) => normalizeUrl(h.url) === searchUrl);

            if (match) {
              // Update
              return platform === "github"
                ? github.updateRepoWebhook(
                    owner,
                    name,
                    match.id as number,
                    {
                      url,
                      secret,
                      content_type: contentType,
                      insecure_ssl: insecureSsl ? "1" : "0",
                    },
                    events
                  )
                : gitlab.updateProjectHook(
                    id,
                    match.id as number,
                    url,
                    { secret, enable_ssl_verification: !insecureSsl },
                    events
                  );
            } else {
              // Create
              return platform === "github"
                ? github.createRepoWebhook(
                    owner,
                    name,
                    {
                      url,
                      content_type: contentType,
                      secret,
                      insecure_ssl: insecureSsl ? "1" : "0",
                    },
                    events
                  )
                : gitlab.createProjectHook(
                    id,
                    url,
                    { secret, enable_ssl_verification: !insecureSsl },
                    events
                  );
            }
          } catch (e: any) {
            throw e;
          }
        })
      );
      return results;
    },
  });
}

export function useBulkDeleteWebhook() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({ repos, url }: { repos: Repository[]; url: string }) => {
      const results = await Promise.allSettled(
        repos.map(async (r) => {
          const [owner, name] = r.fullName.split("/");
          const id = r.id;

          try {
            // 1. List hooks to find the ID by URL
            const existing =
              platform === "github"
                ? await github.listRepoWebhooks(owner, name)
                : await gitlab.listProjectHooks(id);

            const searchUrl = normalizeUrl(url);
            const match = existing.find((h) => normalizeUrl(h.url) === searchUrl);

            if (match) {
              return platform === "github"
                ? github.deleteRepoWebhook(owner, name, match.id as number)
                : gitlab.deleteProjectHook(id, match.id as number);
            }
            return { skipped: true, message: "Webhook not found" };
          } catch (e: any) {
             if (e.response?.status === 404 || e.response?.status === 405) {
                return { skipped: true, message: "Webhook not found" };
             }
             throw e;
          }
        })
      );
      return results;
    },
  });
}

export function useCreateRepoWebhook(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, secret, contentType, insecureSsl, events }: { 
      url: string; 
      secret?: string; 
      contentType?: "json" | "form"; 
      insecureSsl?: boolean; 
      events?: string[] 
    }) => {
      return platform === "github"
        ? await github.createRepoWebhook(owner, repo, { url, secret, content_type: contentType, insecure_ssl: insecureSsl ? "1" : "0" }, events)
        : await gitlab.createProjectHook(`${owner}/${repo}`, url, { secret, enable_ssl_verification: !insecureSsl }, events);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repo-webhooks", platform, owner, repo] });
    },
  });
}

export function useUpdateRepoWebhook(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, url, secret, contentType, insecureSsl, events }: { 
      id: number | string;
      url: string; 
      secret?: string; 
      contentType?: "json" | "form"; 
      insecureSsl?: boolean; 
      events?: string[] 
    }) => {
      return platform === "github"
        ? await github.updateRepoWebhook(owner, repo, id, { url, secret, content_type: contentType, insecure_ssl: insecureSsl ? "1" : "0" }, events)
        : await gitlab.updateProjectHook(`${owner}/${repo}`, id, url, { secret, enable_ssl_verification: !insecureSsl }, events);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repo-webhooks", platform, owner, repo] });
    },
  });
}

export function useDeleteRepoWebhook(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      return platform === "github"
        ? await github.deleteRepoWebhook(owner, repo, id)
        : await gitlab.deleteProjectHook(`${owner}/${repo}`, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["repo-webhooks", platform, owner, repo] });
    },
  });
}

// ─────────────────────────────────────────────
// Repo Branches
// ─────────────────────────────────────────────
export function useRepoBranches(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["repo-branches", platform, owner, repo],
    queryFn: () =>
      platform === "github"
        ? github.listBranches(owner, repo)
        : gitlab.listBranches(`${owner}/${repo}`),
    enabled: !!owner && !!repo,
  });
}

// ─────────────────────────────────────────────
// Repo PRs / MRs
// ─────────────────────────────────────────────
export function useRepoPRs(owner: string, repo: string) {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useQuery({
    queryKey: ["repo-prs", platform, owner, repo],
    queryFn: () =>
      platform === "github"
        ? github.listPullRequests(owner, repo, "open")
        : gitlab.listMergeRequests(`${owner}/${repo}`, "opened"),
    enabled: !!owner && !!repo,
  });
}

// ─────────────────────────────────────────────
// Bulk Branch Operations
// ─────────────────────────────────────────────
export function useBulkCreateBranch() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({
      repos,
      branchName,
      fromRef,
    }: {
      repos: Repository[];
      branchName: string;
      fromRef: string;
    }) => {
      return Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          if (platform === "github") {
            await github.createBranch(owner, repo, branchName, fromRef);
          } else {
            await gitlab.createBranch(r.id, branchName, fromRef);
          }
        })
      );
    },
  });
}

export function useBulkDeleteBranch() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({
      repos,
      branchName,
    }: {
      repos: Repository[];
      branchName: string;
    }) => {
      return Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          try {
            if (platform === "github") {
              await github.deleteBranch(owner, repo, branchName);
            } else {
              await gitlab.deleteBranch(r.id, branchName);
            }
          } catch (e: any) {
            if (e.response?.status === 404) {
              return { skipped: true, message: "Branch not found" };
            }
            throw e;
          }
        })
      );
    },
  });
}

// ─────────────────────────────────────────────
// Bulk Merge (create PR / MR)
// ─────────────────────────────────────────────
export function useBulkMerge() {
  const platform = useAppStore((s) => s.platform);
  const github = useGitHubClient();
  const gitlab = useGitLabClient();

  return useMutation({
    mutationFn: async ({
      repos,
      sourceBranch,
      targetBranch,
      title,
      squash,
      autoMerge,
      mergeMethod,
    }: {
      repos: Repository[];
      sourceBranch: string;
      targetBranch: string;
      title: string;
      squash?: boolean;
      autoMerge?: boolean;
      mergeMethod?: "merge" | "squash" | "rebase";
    }) => {
      return Promise.allSettled(
        repos.map(async (r) => {
          const [owner, repo] = r.fullName.split("/");
          if (platform === "github") {
            let pr: { number: number; html_url: string; skipped?: boolean; message?: string };
            try {
              pr = await github.createPullRequest(owner, repo, title, sourceBranch, targetBranch, "", false);
            } catch (e: any) {
              const status = e.response?.status;
              const msg: string = e.response?.data?.errors?.[0]?.message ?? e.response?.data?.message ?? "";
              if (status === 422) {
                // "A pull request already exists" or "No commits between X and Y"
                const friendly = msg || "No diff or PR already exists";
                return { skipped: true, message: friendly };
              }
              throw e;
            }
            if (autoMerge) {
              try {
                await github.mergePullRequest(owner, repo, pr.number, mergeMethod ?? (squash ? "squash" : "merge"));
              } catch (mergeErr: any) {
                const mergeStatus = mergeErr.response?.status;
                const mergeMsg: string = mergeErr.response?.data?.message ?? "";
                // 405 = not mergeable yet (CI / reviews pending), 422 = merge conflict
                const hint = mergeStatus === 405
                  ? "PR created — merge blocked (branch protection / CI pending)"
                  : mergeStatus === 422
                  ? "PR created — merge conflict"
                  : `PR created — merge failed: ${mergeMsg}`;
                return { ...pr, skipped: true, message: hint };
              }
            }
            return pr;
          } else {
            let mr: any;
            try {
              mr = await gitlab.createMergeRequest(r.id, title, sourceBranch, targetBranch, "", squash ?? false);
            } catch (e: any) {
              const status = e.response?.status;
              const msg: string = e.response?.data?.message ?? "";
              if (status === 422 || (Array.isArray(e.response?.data?.message) && e.response.data.message.some((m: string) => m.includes("already exists")))) {
                return { skipped: true, message: msg || "MR already exists or no diff" };
              }
              throw e;
            }
            if (autoMerge) {
              try {
                await gitlab.acceptMergeRequest(r.id, mr.iid, squash ?? false);
              } catch (mergeErr: any) {
                const mergeMsg: string = mergeErr.response?.data?.message ?? "";
                return { ...mr, skipped: true, message: `MR created — merge failed: ${mergeMsg}` };
              }
            }
            return mr;
          }
        })
      );
    },
  });
}
