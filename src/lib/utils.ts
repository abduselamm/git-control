import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskValue(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return "••••••••" + value.slice(-4);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const parts = input.trim().split("/");
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts.slice(1).join("/") };
  }
  return null;
}

/**
 * Normalizes a URL for comparison by:
 * 1. Removing trailing slashes
 * 2. Converting protocol and hostname to lowercase
 */
export function normalizeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    // Remove trailing slash from pathname if it's more than just "/"
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
  } catch {
    // Fallback if URL is invalid (e.g. some internal path)
    return url.trim().replace(/\/+$/, "");
  }
}
