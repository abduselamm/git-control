"use client";

import { useAppStore } from "@/lib/store/useStore";
import { cn } from "@/lib/utils";
import { GithubIcon } from "@/components/shared/GithubIcon";

interface Props {
  compact?: boolean;
}

function GitLabIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <path d="M24.507 9.5l-.034-.09L21.082.562a.896.896 0 00-1.694.091l-2.29 7.01H8.902L6.61.653a.896.896 0 00-1.694-.09L1.527 9.408l-.034.09A6.33 6.33 0 003.842 16.8l.006.005.016.01 5.038 3.771 2.5 1.894 1.524 1.151a1.034 1.034 0 001.25 0l1.524-1.151 2.5-1.894 5.054-3.782.006-.005a6.33 6.33 0 002.253-7.3z" fill="#FC6D26"/>
    </svg>
  );
}

export function PlatformSwitcher({ compact }: Props) {
  const { platform, setPlatform } = useAppStore();

  return (
    <div
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={() => setPlatform("github")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
          compact ? "px-2" : ""
        )}
        style={
          platform === "github"
            ? { background: "var(--accent-github)", color: "#0d1117" }
            : { color: "var(--text-secondary)" }
        }
        title="GitHub"
        id="platform-github"
      >
        <GithubIcon size={13} />
        {!compact && <span>GitHub</span>}
      </button>

      <button
        onClick={() => setPlatform("gitlab")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
          compact ? "px-2" : ""
        )}
        style={
          platform === "gitlab"
            ? { background: "var(--accent-gitlab)", color: "#fff" }
            : { color: "var(--text-secondary)" }
        }
        title="GitLab"
        id="platform-gitlab"
      >
        <GitLabIcon size={13} />
        {!compact && <span>GitLab</span>}
      </button>
    </div>
  );
}
