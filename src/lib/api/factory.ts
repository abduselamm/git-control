"use client";

import { GitHubAPI } from "./github";
import { GitLabAPI } from "./gitlab";
import { useAppStore } from "@/lib/store/useStore";

/** Returns the GitHub API client seeded with the stored PAT */
export function useGitHubClient(): GitHubAPI {
  const tokens = useAppStore((s) => s.tokens);
  return new GitHubAPI(tokens.github, tokens.githubApiBase);
}

/** Returns the GitLab API client seeded with the stored PAT */
export function useGitLabClient(): GitLabAPI {
  const tokens = useAppStore((s) => s.tokens);
  return new GitLabAPI(tokens.gitlab, tokens.gitlabApiBase);
}
