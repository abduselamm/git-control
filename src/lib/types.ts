// ─────────────────────────────────────────────
// Platform
// ─────────────────────────────────────────────
export type Platform = "github" | "gitlab";

// ─────────────────────────────────────────────
// Token / Connection
// ─────────────────────────────────────────────
export interface TokenConfig {
  github: string;
  gitlab: string;
  githubApiBase: string;
  gitlabApiBase: string;
}

export type ConnectionStatus = "connected" | "disconnected" | "checking" | "error";

// ─────────────────────────────────────────────
// Repository / Project
// ─────────────────────────────────────────────
export interface Repository {
  id: number | string;
  name: string;
  fullName: string;     // owner/repo  or  group/project
  description?: string;
  private: boolean;
  url: string;
  platform: Platform;
}

// ─────────────────────────────────────────────
// Variable
// ─────────────────────────────────────────────
export type VariableVisibility = "all" | "private" | "selected";

export interface Variable {
  id?: string;
  key: string;
  value: string;
  protected?: boolean;
  masked?: boolean;
  environment?: string;
  visibility?: VariableVisibility;   // GitHub org-level
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// Secret (GitHub only — GitLab uses masked Variables)
// ─────────────────────────────────────────────
export interface Secret {
  name: string;
  createdAt?: string;
  updatedAt?: string;
  visibility?: VariableVisibility;   // org-level GitHub secrets
  // NOTE: values are write-only; the API never returns secret values
}

// ─────────────────────────────────────────────
// Webhook
// ─────────────────────────────────────────────
export interface Webhook {
  id?: number | string;
  url: string;
  platform: Platform;
  active: boolean;
  events: string[];      // Unified event names (e.g., 'push', 'issues')
  contentType?: "json" | "form";
  secret?: string;       // Write-only or masked
  insecureSsl?: boolean;
  createdAt?: string;
}

// ─────────────────────────────────────────────
// Operations
// ─────────────────────────────────────────────
export type ItemType = "variable" | "secret" | "webhook" | "branch" | "merge";

// ─────────────────────────────────────────────
// Branch
// ─────────────────────────────────────────────
export interface Branch {
  name: string;
  protected?: boolean;
  default?: boolean;
}

// ─────────────────────────────────────────────
// Merge / Pull Request
// ─────────────────────────────────────────────
export interface PullRequest {
  id: number | string;
  number: number;
  title: string;
  url: string;
  sourceBranch: string;
  targetBranch: string;
  state: "open" | "closed" | "merged";
}



export interface BulkOperationTarget {
  repo: Repository;
  status: "pending" | "success" | "error";
  message?: string;
}

export interface BulkOperation {
  type: "create" | "update" | "delete";
  itemType: ItemType;
  key: string;           // Key for variables/secrets, URL for webhooks
  value?: string;
  targets: BulkOperationTarget[];
  webhookConfig?: Partial<Webhook>; // Extra config for webhooks
}

// ─────────────────────────────────────────────
// API Error
// ─────────────────────────────────────────────
export interface ApiError {
  status: number;
  message: string;
  platform: Platform;
}

// ─────────────────────────────────────────────
// GitHub-specific
// ─────────────────────────────────────────────
export interface GitHubPublicKey {
  key_id: string;
  key: string;
}

