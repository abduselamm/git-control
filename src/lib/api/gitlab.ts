import axios, { AxiosInstance } from "axios";
import type { Repository, Variable, Secret } from "@/lib/types";

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
