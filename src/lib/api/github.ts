import axios, { AxiosInstance } from "axios";
import sodium from "libsodium-wrappers";
import type {
  Repository,
  Variable,
  Secret,
  GitHubPublicKey,
  VariableVisibility,
  Webhook,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Factory — creates a per-request axios client with caller's PAT
// ─────────────────────────────────────────────────────────────
function createClient(token: string, baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Secret encryption (NaCl sealed box)
// ─────────────────────────────────────────────────────────────
async function encryptSecret(publicKey: string, secretValue: string): Promise<string> {
  await sodium.ready;
  const keyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const secretBytes = sodium.from_string(secretValue);
  const encryptedBytes = sodium.crypto_box_seal(secretBytes, keyBytes);
  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────
export class GitHubAPI {
  private client: AxiosInstance;

  constructor(token: string, baseURL = "/api/proxied/github") {
    this.client = createClient(token, baseURL);
  }

  // ── Connection ─────────────────────────────────────────────
  async getAuthUser(): Promise<{ login: string; name: string }> {
    const { data } = await this.client.get("/user");
    return data;
  }

  // ── Repositories ────────────────────────────────────────────
  async listUserRepos(page = 1, perPage = 100): Promise<Repository[]> {
    const { data } = await this.client.get("/user/repos", {
      params: { per_page: perPage, page, sort: "updated" },
    });
    return data.map(mapRepo);
  }

  async listOrgRepos(org: string, page = 1, perPage = 100): Promise<Repository[]> {
    const { data } = await this.client.get(`/orgs/${org}/repos`, {
      params: { per_page: perPage, page, sort: "updated" },
    });
    return data.map(mapRepo);
  }

  /** Fetches ALL pages of org repos, falls back to user repos if org not found */
  async listAllOrgRepos(org: string): Promise<Repository[]> {
    const results: Repository[] = [];
    let page = 1;
    
    // Try Org first
    try {
      while (true) {
        const batch = await this.listOrgRepos(org, page, 100);
        results.push(...batch);
        if (batch.length < 100) break;
        page++;
      }
      return results;
    } catch (e: any) {
      if (e.response?.status === 404) {
        // Fallback to User repos
        results.length = 0;
        page = 1;
        while (true) {
          const { data } = await this.client.get(`/users/${org}/repos`, {
            params: { per_page: 100, page, sort: "updated" },
          });
          const batch = data.map(mapRepo);
          results.push(...batch);
          if (batch.length < 100) break;
          page++;
        }
        return results;
      }
      throw e;
    }
  }

  // ── Repo Variables ──────────────────────────────────────────
  async listRepoVariables(owner: string, repo: string): Promise<Variable[]> {
    const { data } = await this.client.get(
      `/repos/${owner}/${repo}/actions/variables`
    );
    return (data.variables ?? []).map(mapVariable);
  }

  async createRepoVariable(
    owner: string,
    repo: string,
    name: string,
    value: string
  ): Promise<void> {
    await this.client.post(`/repos/${owner}/${repo}/actions/variables`, {
      name,
      value,
    });
  }

  async updateRepoVariable(
    owner: string,
    repo: string,
    name: string,
    value: string
  ): Promise<void> {
    await this.client.patch(
      `/repos/${owner}/${repo}/actions/variables/${name}`,
      { name, value }
    );
  }

  async deleteRepoVariable(owner: string, repo: string, name: string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/actions/variables/${name}`);
  }

  // ── Repo Secrets ─────────────────────────────────────────────
  async getRepoPublicKey(owner: string, repo: string): Promise<GitHubPublicKey> {
    const { data } = await this.client.get(
      `/repos/${owner}/${repo}/actions/secrets/public-key`
    );
    return data;
  }

  async listRepoSecrets(owner: string, repo: string): Promise<Secret[]> {
    const { data } = await this.client.get(
      `/repos/${owner}/${repo}/actions/secrets`
    );
    return (data.secrets ?? []).map(mapSecret);
  }

  async createOrUpdateRepoSecret(
    owner: string,
    repo: string,
    name: string,
    value: string
  ): Promise<void> {
    const pubKey = await this.getRepoPublicKey(owner, repo);
    const encryptedValue = await encryptSecret(pubKey.key, value);
    await this.client.put(`/repos/${owner}/${repo}/actions/secrets/${name}`, {
      encrypted_value: encryptedValue,
      key_id: pubKey.key_id,
    });
  }

  async deleteRepoSecret(owner: string, repo: string, name: string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/actions/secrets/${name}`);
  }

  // ── Org Variables ────────────────────────────────────────────
  async listOrgVariables(org: string): Promise<Variable[]> {
    const { data } = await this.client.get(`/orgs/${org}/actions/variables`);
    return (data.variables ?? []).map(mapVariable);
  }

  async createOrgVariable(
    org: string,
    name: string,
    value: string,
    visibility: VariableVisibility = "all"
  ): Promise<void> {
    await this.client.post(`/orgs/${org}/actions/variables`, {
      name,
      value,
      visibility,
    });
  }

  async updateOrgVariable(
    org: string,
    name: string,
    value: string,
    visibility?: VariableVisibility
  ): Promise<void> {
    await this.client.patch(`/orgs/${org}/actions/variables/${name}`, {
      name,
      value,
      ...(visibility ? { visibility } : {}),
    });
  }

  async deleteOrgVariable(org: string, name: string): Promise<void> {
    await this.client.delete(`/orgs/${org}/actions/variables/${name}`);
  }

  // ── Org Secrets ──────────────────────────────────────────────
  async getOrgPublicKey(org: string): Promise<GitHubPublicKey> {
    const { data } = await this.client.get(`/orgs/${org}/actions/secrets/public-key`);
    return data;
  }

  async listOrgSecrets(org: string): Promise<Secret[]> {
    const { data } = await this.client.get(`/orgs/${org}/actions/secrets`);
    return (data.secrets ?? []).map(mapSecret);
  }

  async createOrUpdateOrgSecret(
    org: string,
    name: string,
    value: string,
    visibility: VariableVisibility = "all"
  ): Promise<void> {
    const pubKey = await this.getOrgPublicKey(org);
    const encryptedValue = await encryptSecret(pubKey.key, value);
    await this.client.put(`/orgs/${org}/actions/secrets/${name}`, {
      encrypted_value: encryptedValue,
      key_id: pubKey.key_id,
      visibility,
    });
  }

  async deleteOrgSecret(org: string, name: string): Promise<void> {
    await this.client.delete(`/orgs/${org}/actions/secrets/${name}`);
  }

  // ── Repo Webhooks ──────────────────────────────────────────
  async listRepoWebhooks(owner: string, repo: string): Promise<Webhook[]> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/hooks`);
    return data.map(mapGHHook);
  }

  async createRepoWebhook(
    owner: string,
    repo: string,
    config: {
      url: string;
      content_type?: "json" | "form";
      secret?: string;
      insecure_ssl?: "0" | "1";
    },
    events: string[] = ["push"],
    active = true
  ): Promise<Webhook> {
    const { data } = await this.client.post(`/repos/${owner}/${repo}/hooks`, {
      name: "web",
      active,
      events,
      config: {
        url: config.url,
        content_type: config.content_type || "json",
        secret: config.secret,
        insecure_ssl: config.insecure_ssl || "0",
      },
    });
    return mapGHHook(data);
  }

  async updateRepoWebhook(
    owner: string,
    repo: string,
    hookId: number | string,
    config: {
      url?: string;
      content_type?: "json" | "form";
      secret?: string;
      insecure_ssl?: "0" | "1";
    },
    events?: string[],
    active?: boolean
  ): Promise<Webhook> {
    const { data } = await this.client.patch(`/repos/${owner}/${repo}/hooks/${hookId}`, {
      active,
      events,
      config: {
        url: config.url,
        content_type: config.content_type,
        secret: config.secret,
        insecure_ssl: config.insecure_ssl,
      },
    });
    return mapGHHook(data);
  }

  async deleteRepoWebhook(owner: string, repo: string, hookId: number | string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
  }

  // ── Branches ──────────────────────────────────────────────
  async listBranches(owner: string, repo: string): Promise<{ name: string; protected: boolean }[]> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/branches`, {
      params: { per_page: 100 },
    });
    return data.map((b: any) => ({ name: b.name, protected: b.protected }));
  }

  async createBranch(owner: string, repo: string, branchName: string, fromRef: string): Promise<void> {
    // Resolve the SHA of the source ref
    let sha: string;
    try {
      const { data } = await this.client.get(`/repos/${owner}/${repo}/git/ref/heads/${fromRef}`);
      sha = data.object.sha;
    } catch {
      // Maybe it's a tag
      const { data } = await this.client.get(`/repos/${owner}/${repo}/git/ref/tags/${fromRef}`);
      sha = data.object.sha;
    }
    await this.client.post(`/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha,
    });
  }

  async deleteBranch(owner: string, repo: string, branchName: string): Promise<void> {
    await this.client.delete(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`);
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string,
    body = "",
    draft = false
  ): Promise<{ number: number; html_url: string }> {
    const { data } = await this.client.post(`/repos/${owner}/${repo}/pulls`, {
      title,
      head,
      base,
      body,
      draft,
    });
    return { number: data.number, html_url: data.html_url };
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    mergeMethod: "merge" | "squash" | "rebase" = "merge"
  ): Promise<void> {
    await this.client.put(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
      merge_method: mergeMethod,
    });
  }

  async listPullRequests(owner: string, repo: string, state: "open" | "closed" | "all" = "open"): Promise<import("@/lib/types").PullRequest[]> {
    const { data } = await this.client.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state, per_page: 100 },
    });
    return data.map((pr: any) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      state: pr.state === "open" ? "open" : (pr.merged_at ? "merged" : "closed"),
    }));
  }
}

// ─────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────
function mapRepo(r: Record<string, unknown>): Repository {
  return {
    id: r.id as number,
    name: r.name as string,
    fullName: r.full_name as string,
    description: r.description as string | undefined,
    private: r.private as boolean,
    url: r.html_url as string,
    platform: "github",
  };
}

function mapVariable(v: Record<string, unknown>): Variable {
  return {
    key: (v.name as string) ?? "",
    value: (v.value as string) ?? "",
    updatedAt: v.updated_at as string | undefined,
    visibility: v.visibility as VariableVisibility | undefined,
  };
}

function mapSecret(s: Record<string, unknown>): Secret {
  return {
    name: s.name as string,
    createdAt: s.created_at as string | undefined,
    updatedAt: s.updated_at as string | undefined,
    visibility: s.visibility as VariableVisibility | undefined,
  };
}

function mapGHHook(h: any): Webhook {
  return {
    id: h.id,
    url: h.config.url,
    platform: "github",
    active: h.active,
    events: h.events,
    contentType: h.config.content_type === "json" ? "json" : "form",
    insecureSsl: h.config.insecure_ssl === "1",
    createdAt: h.created_at,
  };
}
