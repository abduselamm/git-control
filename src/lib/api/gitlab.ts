import axios, { AxiosInstance } from "axios";
import type { Repository, Variable, Secret, Webhook } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────
function createClient(token: string, baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      "PRIVATE-TOKEN": token,
      "Content-Type": "application/json",
    },
  });
}

// ─────────────────────────────────────────────────────────────
// GitLab uses a "masked" flag on variables instead of separate secrets
// ─────────────────────────────────────────────────────────────
export class GitLabAPI {
  private client: AxiosInstance;

  constructor(token: string, baseURL = "/api/proxied/gitlab") {
    this.client = createClient(token, baseURL);
  }

  // ── Connection ──────────────────────────────────────────────
  async getAuthUser(): Promise<{ username: string; name: string }> {
    const { data } = await this.client.get("/user");
    return data;
  }

  // ── Projects (Repositories) ─────────────────────────────────
  async listUserProjects(page = 1, perPage = 100): Promise<Repository[]> {
    const { data } = await this.client.get("/projects", {
      params: {
        membership: true,
        per_page: perPage,
        page,
        order_by: "last_activity_at",
        simple: true,
      },
    });
    return data.map(mapProject);
  }

  async listGroupProjects(group: string, page = 1, perPage = 100): Promise<Repository[]> {
    const encoded = encodeURIComponent(group);
    const { data } = await this.client.get(`/groups/${encoded}/projects`, {
      params: { per_page: perPage, page, include_subgroups: true, simple: true },
    });
    return data.map(mapProject);
  }

  /** Fetches ALL pages of group projects, falls back to user projects if group not found */
  async listAllGroupProjects(group: string): Promise<Repository[]> {
    const results: Repository[] = [];
    let page = 1;

    try {
      while (true) {
        const batch = await this.listGroupProjects(group, page, 100);
        results.push(...batch);
        if (batch.length < 100) break;
        page++;
      }
      return results;
    } catch (e: any) {
      if (e.response?.status === 404) {
        results.length = 0;
        page = 1;
        while (true) {
          const { data } = await this.client.get(`/users/${encodeURIComponent(group)}/projects`, {
            params: { per_page: 100, page, simple: true },
          });
          const batch = data.map(mapProject);
          results.push(...batch);
          if (batch.length < 100) break;
          page++;
        }
        return results;
      }
      throw e;
    }
  }

  // ── Project Variables ────────────────────────────────────────
  async listProjectVariables(projectId: string | number): Promise<Variable[]> {
    const { data } = await this.client.get(
      `/projects/${projectId}/variables`
    );
    return data.map(mapGLVariable);
  }

  async createProjectVariable(
    projectId: string | number,
    key: string,
    value: string,
    masked = false,
    protected_ = false,
    environment = "*"
  ): Promise<void> {
    await this.client.post(`/projects/${projectId}/variables`, {
      key,
      value,
      masked,
      protected: protected_,
      environment_scope: environment,
    });
  }

  async updateProjectVariable(
    projectId: string | number,
    key: string,
    value: string,
    masked?: boolean,
    environment = "*"
  ): Promise<void> {
    await this.client.put(
      `/projects/${projectId}/variables/${key}`,
      {
        value,
        ...(masked !== undefined ? { masked } : {}),
        environment_scope: environment,
      }
    );
  }

  async deleteProjectVariable(
    projectId: string | number,
    key: string
  ): Promise<void> {
    await this.client.delete(`/projects/${projectId}/variables/${key}`);
  }

  // GitLab has no separate "secret" entity - masked variables serve that purpose
  async listProjectSecrets(projectId: string | number): Promise<Variable[]> {
    const all = await this.listProjectVariables(projectId);
    return all.filter((v) => v.masked);
  }

  // ── Group Variables ──────────────────────────────────────────
  async listGroupVariables(group: string): Promise<Variable[]> {
    const encoded = encodeURIComponent(group);
    const { data } = await this.client.get(`/groups/${encoded}/variables`);
    return data.map(mapGLVariable);
  }

  async createGroupVariable(
    group: string,
    key: string,
    value: string,
    masked = false,
    protected_ = false
  ): Promise<void> {
    const encoded = encodeURIComponent(group);
    await this.client.post(`/groups/${encoded}/variables`, {
      key,
      value,
      masked,
      protected: protected_,
    });
  }

  async updateGroupVariable(
    group: string,
    key: string,
    value: string,
    masked?: boolean
  ): Promise<void> {
    const encoded = encodeURIComponent(group);
    await this.client.put(`/groups/${encoded}/variables/${key}`, {
      value,
      ...(masked !== undefined ? { masked } : {}),
    });
  }

  async deleteGroupVariable(group: string, key: string): Promise<void> {
    const encoded = encodeURIComponent(group);
    await this.client.delete(`/groups/${encoded}/variables/${key}`);
  }

  async listGroupSecrets(group: string): Promise<Variable[]> {
    const all = await this.listGroupVariables(group);
    return all.filter((v) => v.masked);
  }

  // ── Project Webhooks ─────────────────────────────────────────
  async listProjectHooks(projectId: string | number): Promise<Webhook[]> {
    const { data } = await this.client.get(`/projects/${projectId}/hooks`);
    return data.map(mapGLHook);
  }

  async createProjectHook(
    projectId: string | number,
    url: string,
    config: {
      secret?: string;
      enable_ssl_verification?: boolean;
    },
    events: string[] = ["push"]
  ): Promise<Webhook> {
    const body: any = {
      url,
      token: config.secret,
      enable_ssl_verification: config.enable_ssl_verification ?? true,
    };

    if (events.includes("push")) body.push_events = true;
    if (events.includes("issues")) body.issues_events = true;
    if (events.includes("merge_requests")) body.merge_requests_events = true;
    if (events.includes("tag_push")) body.tag_push_events = true;
    if (events.includes("note")) body.note_events = true;
    if (events.includes("job")) body.job_events = true;
    if (events.includes("pipeline")) body.pipeline_events = true;
    if (events.includes("wiki_page")) body.wiki_page_events = true;

    const { data } = await this.client.post(`/projects/${projectId}/hooks`, body);
    return mapGLHook(data);
  }

  async updateProjectHook(
    projectId: string | number,
    hookId: number | string,
    url?: string,
    config?: {
      secret?: string;
      enable_ssl_verification?: boolean;
    },
    events?: string[]
  ): Promise<Webhook> {
    const body: any = {
      url,
      token: config?.secret,
      enable_ssl_verification: config?.enable_ssl_verification,
    };

    if (events) {
       body.push_events = events.includes("push");
       body.issues_events = events.includes("issues");
       body.merge_requests_events = events.includes("merge_requests");
       body.tag_push_events = events.includes("tag_push");
       body.note_events = events.includes("note");
       body.job_events = events.includes("job");
       body.pipeline_events = events.includes("pipeline");
       body.wiki_page_events = events.includes("wiki_page");
    }

    const { data } = await this.client.put(`/projects/${projectId}/hooks/${hookId}`, body);
    return mapGLHook(data);
  }

  async deleteProjectHook(projectId: string | number, hookId: number | string): Promise<void> {
    await this.client.delete(`/projects/${projectId}/hooks/${hookId}`);
  }

  // ── Branches ──────────────────────────────────────────────
  async listBranches(projectId: string | number): Promise<{ name: string; protected: boolean; default: boolean }[]> {
    const { data } = await this.client.get(`/projects/${encodeURIComponent(String(projectId))}/repository/branches`, {
      params: { per_page: 100 },
    });
    return data.map((b: any) => ({ name: b.name, protected: b.protected, default: b.default }));
  }

  async createBranch(projectId: string | number, branchName: string, ref: string): Promise<void> {
    await this.client.post(`/projects/${encodeURIComponent(String(projectId))}/repository/branches`, {
      branch: branchName,
      ref,
    });
  }

  async deleteBranch(projectId: string | number, branchName: string): Promise<void> {
    await this.client.delete(
      `/projects/${encodeURIComponent(String(projectId))}/repository/branches/${encodeURIComponent(branchName)}`
    );
  }

  async createMergeRequest(
    projectId: string | number,
    title: string,
    sourceBranch: string,
    targetBranch: string,
    description = "",
    squash = false
  ): Promise<{ iid: number; web_url: string }> {
    const { data } = await this.client.post(
      `/projects/${encodeURIComponent(String(projectId))}/merge_requests`,
      {
        title,
        source_branch: sourceBranch,
        target_branch: targetBranch,
        description,
        squash,
      }
    );
    return { iid: data.iid, web_url: data.web_url };
  }

  async acceptMergeRequest(
    projectId: string | number,
    mergeRequestIid: number,
    squash = false
  ): Promise<void> {
    await this.client.put(
      `/projects/${encodeURIComponent(String(projectId))}/merge_requests/${mergeRequestIid}/merge`,
      { squash, should_remove_source_branch: false }
    );
  }

  async listMergeRequests(projectId: string | number, state: "opened" | "closed" | "merged" | "all" = "opened"): Promise<import("@/lib/types").PullRequest[]> {
    const { data } = await this.client.get(`/projects/${encodeURIComponent(String(projectId))}/merge_requests`, {
      params: { state, per_page: 100 },
    });
    return data.map((mr: any) => ({
      id: mr.id,
      number: mr.iid,
      title: mr.title,
      url: mr.web_url,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      state: mr.state === "opened" ? "open" : mr.state,
    }));
  }
}

// ─────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────
function mapProject(p: Record<string, unknown>): Repository {
  return {
    id: p.id as number,
    name: p.name as string,
    fullName: p.path_with_namespace as string,
    description: p.description as string | undefined,
    private: (p.visibility as string) !== "public",
    url: p.web_url as string,
    platform: "gitlab",
  };
}

function mapGLVariable(v: Record<string, unknown>): Variable {
  return {
    key: v.key as string,
    value: (v.value as string) ?? "",
    protected: v.protected as boolean,
    masked: v.masked as boolean,
    environment: v.environment_scope as string | undefined,
  };
}

function mapGLHook(h: any): Webhook {
  const events: string[] = [];
  if (h.push_events) events.push("push");
  if (h.issues_events) events.push("issues");
  if (h.merge_requests_events) events.push("merge_requests");
  if (h.tag_push_events) events.push("tag_push");
  if (h.note_events) events.push("note");
  if (h.job_events) events.push("job");
  if (h.pipeline_events) events.push("pipeline");
  if (h.wiki_page_events) events.push("wiki_page");

  return {
    id: h.id,
    url: h.url,
    platform: "gitlab",
    active: true,
    events,
    contentType: "json",
    insecureSsl: !h.enable_ssl_verification,
    createdAt: h.created_at,
  };
}
