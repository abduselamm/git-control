"use client";

import { useState, useMemo } from "react";
import {
  PlayCircle, CheckCircle2, XCircle, Clock, Eye, EyeOff, Search,
  ChevronDown, ChevronRight, Loader2, RefreshCw, GitBranch, GitMerge
} from "lucide-react";
import { useAppStore } from "@/lib/store/useStore";
import { OrgInput } from "@/components/shared/OrgInput";
import {
  useOrgRepos,
  useRepoVariables,
  useRepoSecrets,
  useRepoWebhooks,
  useRepoBranches,
  useBulkPropagateVariable,
  useBulkPropagateSecret,
  useBulkPropagateWebhook,
  useBulkDeleteVariable,
  useBulkDeleteSecret,
  useBulkDeleteWebhook,
  useBulkCreateBranch,
  useBulkDeleteBranch,
  useBulkMerge,
} from "@/hooks/useGitOperations";
import type { Repository } from "@/lib/types";

type ItemType = "variable" | "secret" | "webhook" | "branch" | "merge";
type ActionType = "upsert" | "delete";
type ResultStatus = "pending" | "success" | "error";

interface PropagateResult {
  repo: string;
  status: ResultStatus;
  message?: string;
}

function RepoRowDetails({ repo, itemType, onItemClick }: { repo: Repository; itemType: ItemType; onItemClick?: (item: any) => void }) {
  const parts = repo.fullName.split("/");
  const owner = parts[0] || "";
  const name = parts.slice(1).join("/");

  const { data: vData, isLoading: vLoad } = useRepoVariables(owner, name);
  const { data: sData, isLoading: sLoad } = useRepoSecrets(owner, name);
  const { data: wData, isLoading: wLoad } = useRepoWebhooks(owner, name);
  const { data: bData, isLoading: bLoad } = useRepoBranches(owner, name);

  const variablesArray: any[] = Array.isArray(vData) ? vData : (vData as any)?.variables ?? [];
  const secretsArray: any[] = Array.isArray(sData) ? sData : (sData as any)?.secrets ?? [];
  const webhooksArray: any[] = Array.isArray(wData) ? wData : (wData as any)?.hooks ?? [];
  const branchesArray: any[] = Array.isArray(bData) ? bData : [];

  let items: any[] = [];
  let isLoading = false;

  if (itemType === "variable") { items = variablesArray; isLoading = vLoad; }
  else if (itemType === "secret") { items = secretsArray; isLoading = sLoad; }
  else if (itemType === "webhook") { items = webhooksArray; isLoading = wLoad; }
  else if (itemType === "branch" || itemType === "merge") { items = branchesArray; isLoading = bLoad; }

  if (isLoading) {
    return <div className="py-3 px-10 flex"><Loader2 size={14} className="animate-spin text-[hsl(var(--muted-foreground))]" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="py-3 px-10 text-xs text-[hsl(var(--muted-foreground))]">
        No existing {itemType === "merge" ? "branch" : itemType}es found.
      </div>
    );
  }

  return (
    <div className="py-3 px-10 bg-[hsl(var(--muted))/30] border-t border-[hsl(var(--border))]">
      <div className="flex flex-wrap gap-2">
        {items.map((item: any, idx: number) => {
          const itemName = item.name || item.key || item.url || item.id?.toString() || "Unknown";
          const itemKey = item.id?.toString() || item.url || item.name || item.key || `idx-${idx}`;
          const isDefault = item.default;
          const isProtected = item.protected;
          return (
            <span
              key={itemKey}
              onClick={() => onItemClick?.(item)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] ${onItemClick ? "cursor-pointer hover:border-[hsl(var(--foreground))] transition-colors" : ""}`}
            >
              {(itemType === "branch" || itemType === "merge") && (
                <GitBranch size={10} className="shrink-0 text-[hsl(var(--muted-foreground))]" />
              )}
              {itemName}
              {isDefault && (
                <span className="ml-1 text-[9px] px-1 rounded bg-emerald-500/15 text-emerald-600 font-semibold uppercase">default</span>
              )}
              {isProtected && (
                <span className="ml-0.5 text-[9px] px-1 rounded bg-amber-500/15 text-amber-600 font-semibold uppercase">protected</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function RepoRow({
  repo,
  itemType,
  isSelected,
  toggleRepo,
  result,
  running,
  onItemClick
}: {
  repo: Repository;
  itemType: ItemType;
  isSelected: boolean;
  toggleRepo: () => void;
  result?: PropagateResult;
  running: boolean;
  onItemClick?: (item: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`overflow-hidden rounded-md border border-transparent transition-colors ${isSelected ? "bg-[hsl(var(--muted))/50] border-[hsl(var(--border))]" : "hover:bg-[hsl(var(--muted))]"}`}>
      <div className="flex items-center justify-between p-2.5 cursor-pointer">
        <div className="flex items-center gap-3 overflow-hidden flex-1" onClick={(e) => {
          if ((e.target as HTMLElement).tagName.toLowerCase() !== 'input') {
            setExpanded(!expanded);
          }
        }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1 -ml-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); toggleRepo(); }}
            className="rounded border-[hsl(var(--border))] accent-[hsl(var(--foreground))] mt-0.5"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-sm font-medium truncate text-[hsl(var(--foreground))] select-none">
            {repo.name}
          </span>
        </div>

        {result && (
          <span className="flex items-center pl-2 shrink-0 max-w-[55%]">
            {result.status === "success" && (
              <div className="flex items-center gap-2">
                {result.message && (
                  <span className="text-[10px] font-medium text-amber-500/80 px-1.5 py-0.5 rounded bg-amber-500/5 border border-amber-500/10 truncate max-w-[160px]" title={result.message}>
                    {result.message}
                  </span>
                )}
                <CheckCircle2 size={16} className={result.message ? "text-amber-500/50" : "text-emerald-500"} />
              </div>
            )}
            {result.status === "error" && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="text-[10px] font-medium text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/8 border border-rose-500/15 truncate max-w-[180px]"
                  title={result.message}
                >
                  {result.message}
                </span>
                <XCircle size={14} className="text-rose-500 shrink-0" />
              </div>
            )}
            {result.status === "pending" && running && <Clock size={16} className="text-amber-500 animate-pulse" />}
          </span>
        )}
      </div>

      {expanded && (
        <RepoRowDetails repo={repo} itemType={itemType} onItemClick={onItemClick} />
      )}
    </div>
  );
}

export default function BulkPropagatePage() {
  const { platform, tokens } = useAppStore();
  const hasToken = platform === "github" ? !!tokens.github : !!tokens.gitlab;

  const [activeOrg, setActiveOrg] = useState("");
  const [itemType, setItemType] = useState<ItemType>("variable");
  const [action, setAction] = useState<ActionType>("upsert");
  const [key, setKey] = useState(""); // variable key / secret name / webhook url / branch name
  const [value, setValue] = useState(""); // variable value / secret value / webhook secret
  const [showValue, setShowValue] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");

  // Webhook specific
  const [webhookContentType, setWebhookContentType] = useState<"json" | "form">("json");
  const [webhookInsecureSsl, setWebhookInsecureSsl] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["push"]);

  // Branch specific
  const [fromRef, setFromRef] = useState("main");

  // Merge specific
  const [sourceBranch, setSourceBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [mergeTitle, setMergeTitle] = useState("");
  const [squash, setSquash] = useState(false);
  const [autoMerge, setAutoMerge] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">("merge");

  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, PropagateResult>>({});

  const {
    data: allRepos = [],
    isLoading: reposLoading,
    isFetching: reposFetching,
    refetch: refetchRepos,
    error: reposError
  } = useOrgRepos(activeOrg);

  const propagateVar = useBulkPropagateVariable();
  const propagateSec = useBulkPropagateSecret();
  const deleteVar = useBulkDeleteVariable();
  const deleteSec = useBulkDeleteSecret();
  const propagateWh = useBulkPropagateWebhook();
  const deleteWh = useBulkDeleteWebhook();
  const createBranch = useBulkCreateBranch();
  const deleteBranch = useBulkDeleteBranch();
  const bulkMerge = useBulkMerge();

  const filteredRepos = useMemo(() =>
    allRepos.filter((r: Repository) => r.name.toLowerCase().includes(repoSearch.toLowerCase())),
    [allRepos, repoSearch]
  );

  const selectedAll = filteredRepos.length > 0 &&
    filteredRepos.every((r: Repository) => selectedRepos.has(r.name));

  function toggleSelectAll(checked: boolean) {
    const next = new Set(selectedRepos);
    if (checked) {
      filteredRepos.forEach((r: Repository) => next.add(r.name));
    } else {
      filteredRepos.forEach((r: Repository) => next.delete(r.name));
    }
    setSelectedRepos(next);
  }

  function toggleRepo(name: string) {
    const next = new Set(selectedRepos);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedRepos(next);
  }

  function handleItemClick(item: any) {
    if (itemType === "variable" || itemType === "secret") {
      setKey(item.name || item.key || "");
      setValue(itemType === "variable" ? (item.value || "") : ""); // value cannot be returned for secrets
      setAction("upsert");
    } else if (itemType === "webhook") {
      setKey(item.url || "");
      if (item.contentType) setWebhookContentType(item.contentType as "json" | "form");
      setWebhookInsecureSsl(!!item.insecureSsl);
      if (item.events) setWebhookEvents(item.events);
      setValue(""); // secret is write-only
      setAction("upsert");
    } else if (itemType === "branch" || itemType === "merge") {
      setKey(item.name || "");
      setFromRef("main");
      if (itemType === "merge") {
        setSourceBranch(item.name || "");
      }
      setAction("upsert");
    }
  }

  // Validate run button
  function isRunDisabled() {
    if (running || !activeOrg || selectedRepos.size === 0) return true;
    if (itemType === "variable") return !key || (action === "upsert" && !value);
    if (itemType === "secret") return !key || (action === "upsert" && !value);
    if (itemType === "webhook") return !key;
    if (itemType === "branch") return !key || (action === "upsert" && !fromRef);
    if (itemType === "merge") return !sourceBranch || !targetBranch || !mergeTitle;
    return false;
  }

  function getRunLabel() {
    const count = selectedRepos.size;
    const suffix = `${count} repo${count !== 1 ? "s" : ""}`;
    if (itemType === "branch") {
      return action === "upsert" ? `Create branch in ${suffix}` : `Delete branch from ${suffix}`;
    }
    if (itemType === "merge") {
      return `Open ${platform === "github" ? "PR" : "MR"} in ${suffix}`;
    }
    return action === "upsert" ? `Propagate to ${suffix}` : `Delete from ${suffix}`;
  }

  async function handleRun() {
    if (isRunDisabled()) return;

    setRunning(true);
    const targetReposArray = allRepos.filter((r: Repository) => selectedRepos.has(r.name));
    const targetRepos = targetReposArray.map((r: Repository) => r.name);

    const initialResults: Record<string, PropagateResult> = {};
    for (const repo of targetRepos) {
      initialResults[repo] = { repo, status: "pending" };
    }
    setResults({ ...initialResults });

    try {
      let bulkResult: PromiseSettledResult<any>[];

      if (itemType === "variable") {
        bulkResult = action === "upsert"
          ? await propagateVar.mutateAsync({ repos: targetReposArray, key, value, masked: false })
          : await deleteVar.mutateAsync({ repos: targetReposArray, key });
      } else if (itemType === "secret") {
        bulkResult = action === "upsert"
          ? await propagateSec.mutateAsync({ repos: targetReposArray, name: key, value })
          : await deleteSec.mutateAsync({ repos: targetReposArray, name: key });
      } else if (itemType === "webhook") {
        bulkResult = action === "upsert"
          ? await propagateWh.mutateAsync({
              repos: targetReposArray,
              url: key,
              secret: value,
              contentType: webhookContentType,
              insecureSsl: webhookInsecureSsl,
              events: webhookEvents,
            })
          : await deleteWh.mutateAsync({ repos: targetReposArray, url: key });
      } else if (itemType === "branch") {
        bulkResult = action === "upsert"
          ? await createBranch.mutateAsync({ repos: targetReposArray, branchName: key, fromRef })
          : await deleteBranch.mutateAsync({ repos: targetReposArray, branchName: key });
      } else {
        // merge
        bulkResult = await bulkMerge.mutateAsync({
          repos: targetReposArray,
          sourceBranch,
          targetBranch,
          title: mergeTitle,
          squash,
          autoMerge,
          mergeMethod,
        });
      }

      setResults((prev) => {
        const next = { ...prev };
        bulkResult.forEach((res, i) => {
          const repoName = targetReposArray[i].name;
          if (res.status === "fulfilled") {
            const val = res.value as any;
            if (val?.skipped) {
              next[repoName] = { repo: repoName, status: "success", message: val.message };
            } else {
              next[repoName] = { repo: repoName, status: "success" };
            }
          } else {
            next[repoName] = { repo: repoName, status: "error", message: extractApiError(res.reason) };
          }
        });
        return next;
      });
    } catch (e: unknown) {
      console.error("Bulk process failed", e);
    }
    setRunning(false);
  }

  function extractApiError(err: any): string {
    if (!err) return "Unknown error";
    const status = err.response?.status;
    const data = err.response?.data;

    // Build a rich message from the API body first
    if (data) {
      // GitHub: { message: "...", errors: [{ message: "..." }] }
      const parts: string[] = [];
      if (data.message) parts.push(data.message);
      if (Array.isArray(data.errors)) {
        data.errors.forEach((e: any) => {
          if (typeof e === "string") parts.push(e);
          else if (e?.message) parts.push(e.message);
          else if (e?.code) parts.push(e.code);
        });
      }
      // GitLab: { error: "...", error_description: "..." } or { message: "..." }
      if (data.error) parts.push(data.error);
      if (data.error_description) parts.push(data.error_description);
      if (parts.length > 0) {
        const msg = parts.join(" — ");
        return status ? `[${status}] ${msg}` : msg;
      }
    }

    // Fallback hints by status code
    if (status === 401) return "[401] Invalid or missing token";
    if (status === 403) return "[403] Permission denied or rate limited";
    if (status === 404) return "[404] Resource not found";
    if (status === 409) return "[409] Conflict (branch/PR may already exist)";
    if (status === 422) return `[422] Unprocessable — check branch names / repo state`;

    return err.message || "An unexpected error occurred";
  }

  function getErrorMessage(err: any): string {
    return extractApiError(err);
  }

  const accent = platform === "github" ? "hsl(var(--foreground))" : "var(--accent-gitlab)";
  const bgAccent = platform === "github" ? "hsl(var(--background))" : "#fff";

  const typeItems: { id: ItemType; label: string; icon?: React.ReactNode }[] = [
    { id: "variable", label: "Variable" },
    { id: "secret", label: "Secret" },
    { id: "webhook", label: "Webhook" },
    { id: "branch", label: "Branch", icon: <GitBranch size={12} /> },
    { id: "merge", label: platform === "github" ? "Pull Request" : "Merge Request", icon: <GitMerge size={12} /> },
  ];

  return (
    <div className="flex-1 space-y-6 fade-in max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Bulk Propagate</h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Push variables, secrets, webhooks, branches, or open merge requests across all org repositories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-6">
          <div className="saas-card overflow-hidden">
            <div className="saas-card-header pb-4 border-b bg-[hsl(var(--muted))] p-4">
              <h3 className="font-semibold text-base">Target Configuration</h3>
            </div>
            <div className="saas-card-content pt-6">
              <OrgInput org={activeOrg} setOrg={setActiveOrg} />
            </div>
          </div>

          <div className="saas-card overflow-hidden">
            <div className="saas-card-header pb-4 border-b bg-[hsl(var(--muted))] p-4">
              <h3 className="font-semibold text-base">Payload</h3>
            </div>
            <div className="saas-card-content pt-6 space-y-5">

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Type</label>
                <div className="flex flex-wrap gap-1 p-1 rounded-lg border bg-[hsl(var(--muted))]">
                  {typeItems.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setItemType(t.id); setResults({}); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                        itemType === t.id ? "shadow" : "hover:bg-[hsl(var(--background))/50]"
                      }`}
                      style={
                        itemType === t.id
                          ? { background: accent, color: bgAccent }
                          : { color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* === Variables / Secrets === */}
              {(itemType === "variable" || itemType === "secret") && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Action</label>
                      <div className="flex p-1 rounded-lg border bg-[hsl(var(--muted))]">
                        {(["upsert", "delete"] as ActionType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setAction(t)}
                            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              action === t ? "shadow" : "hover:bg-[hsl(var(--background))/50]"
                            }`}
                            style={
                              action === t
                                ? { background: t === "delete" ? "hsl(var(--destructive))" : accent, color: t === "delete" ? "white" : bgAccent }
                                : { color: "hsl(var(--muted-foreground))" }
                            }
                          >
                            {t === "upsert" ? "Create / Update" : "Delete"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Key / Name</label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toUpperCase().replace(/\s/g, "_"))}
                      placeholder="MY_KEY"
                      className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {action === "upsert" && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Value</label>
                      <div className="relative">
                        <input
                          type={showValue ? "text" : "password"}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="Enter value…"
                          className="w-full px-3 py-2 pr-10 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowValue((p) => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        >
                          {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* === Webhook === */}
              {itemType === "webhook" && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Action</label>
                      <div className="flex p-1 rounded-lg border bg-[hsl(var(--muted))]">
                        {(["upsert", "delete"] as ActionType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setAction(t)}
                            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              action === t ? "shadow" : "hover:bg-[hsl(var(--background))/50]"
                            }`}
                            style={
                              action === t
                                ? { background: t === "delete" ? "hsl(var(--destructive))" : accent, color: t === "delete" ? "white" : bgAccent }
                                : { color: "hsl(var(--muted-foreground))" }
                            }
                          >
                            {t === "upsert" ? "Create / Update" : "Delete"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Payload URL</label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="https://example.com/webhook"
                      className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase mb-2 text-[hsl(var(--foreground))]">Content Type</label>
                        <select
                          value={webhookContentType}
                          onChange={(e) => setWebhookContentType(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-md text-sm border bg-[hsl(var(--background))] focus:outline-none"
                        >
                          <option value="json">application/json</option>
                          <option value="form">application/x-www-form-urlencoded</option>
                        </select>
                      </div>
                      <div className="flex-1 flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-sm cursor-pointer py-2">
                          <input
                            type="checkbox"
                            checked={webhookInsecureSsl}
                            onChange={(e) => setWebhookInsecureSsl(e.target.checked)}
                            className="rounded border-[hsl(var(--border))]"
                          />
                          <span className="text-xs uppercase font-medium">Insecure SSL</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-2 text-[hsl(var(--foreground))]">Events</label>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {["push", "issues", "merge_requests", "tag_push", "note", "job", "pipeline", "wiki_page"].map((ev) => (
                          <label key={ev} className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors">
                            <input
                              type="checkbox"
                              checked={webhookEvents.includes(ev)}
                              onChange={(e) => {
                                if (e.target.checked) setWebhookEvents([...webhookEvents, ev]);
                                else setWebhookEvents(webhookEvents.filter((x) => x !== ev));
                              }}
                              className="rounded h-3 w-3"
                            />
                            <span className="capitalize">{ev.replace(/_/g, " ")}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {action === "upsert" && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Secret (Optional)</label>
                      <div className="relative">
                        <input
                          type={showValue ? "text" : "password"}
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder="Webhook secret…"
                          className="w-full px-3 py-2 pr-10 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowValue((p) => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        >
                          {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* === Branch === */}
              {itemType === "branch" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Action</label>
                    <div className="flex p-1 rounded-lg border bg-[hsl(var(--muted))]">
                      {(["upsert", "delete"] as ActionType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setAction(t)}
                          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            action === t ? "shadow" : "hover:bg-[hsl(var(--background))/50]"
                          }`}
                          style={
                            action === t
                              ? { background: t === "delete" ? "hsl(var(--destructive))" : accent, color: t === "delete" ? "white" : bgAccent }
                              : { color: "hsl(var(--muted-foreground))" }
                          }
                        >
                          {t === "upsert" ? "Create" : "Delete"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">
                      <GitBranch size={13} className="inline mr-1.5 -mt-0.5" />
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="feature/my-feature"
                      className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {action === "upsert" && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">
                        From Ref <span className="text-[hsl(var(--muted-foreground))] font-normal">(branch / tag / SHA)</span>
                      </label>
                      <input
                        type="text"
                        value={fromRef}
                        onChange={(e) => setFromRef(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                </>
              )}

              {/* === Merge / PR === */}
              {itemType === "merge" && (
                <>
                  <div className="p-3 rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] flex items-start gap-2">
                    <GitMerge size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Opens a <strong className="text-[hsl(var(--foreground))]">{platform === "github" ? "Pull Request" : "Merge Request"}</strong> from source → target in every selected repository.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Source Branch</label>
                      <input
                        type="text"
                        value={sourceBranch}
                        onChange={(e) => setSourceBranch(e.target.value)}
                        placeholder="feature/my-feature"
                        className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Target Branch</label>
                      <input
                        type="text"
                        value={targetBranch}
                        onChange={(e) => setTargetBranch(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">
                      {platform === "github" ? "PR" : "MR"} Title
                    </label>
                    <input
                      type="text"
                      value={mergeTitle}
                      onChange={(e) => setMergeTitle(e.target.value)}
                      placeholder={`Merge ${sourceBranch || "feature"} into ${targetBranch || "main"}`}
                      className="w-full px-3 py-2 rounded-md text-sm border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={squash}
                        onChange={(e) => setSquash(e.target.checked)}
                        className="rounded border-[hsl(var(--border))] h-4 w-4"
                      />
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">Squash commits on merge</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoMerge}
                        onChange={(e) => setAutoMerge(e.target.checked)}
                        className="rounded border-[hsl(var(--border))] h-4 w-4"
                      />
                      <span className="text-sm font-medium text-[hsl(var(--foreground))]">Auto-merge after opening</span>
                    </label>

                    {autoMerge && platform === "github" && (
                      <div className="pl-6">
                        <label className="block text-xs font-semibold uppercase mb-1.5 text-[hsl(var(--muted-foreground))]">Merge Method</label>
                        <div className="flex gap-1 p-1 rounded-lg border bg-[hsl(var(--muted))]">
                          {(["merge", "squash", "rebase"] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setMergeMethod(m)}
                              className={`flex-1 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                                mergeMethod === m ? "shadow" : "hover:bg-[hsl(var(--background))/50]"
                              }`}
                              style={
                                mergeMethod === m
                                  ? { background: accent, color: bgAccent }
                                  : { color: "hsl(var(--muted-foreground))" }
                              }
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="saas-card-footer mt-4">
              <button
                onClick={handleRun}
                disabled={isRunDisabled()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium shadow-sm transition-opacity disabled:opacity-50"
                style={
                  action === "delete" && itemType !== "merge"
                    ? { background: "hsl(var(--destructive))", color: "white" }
                    : { background: accent, color: bgAccent }
                }
              >
                {itemType === "merge" ? <GitMerge size={16} /> : itemType === "branch" ? <GitBranch size={16} /> : <PlayCircle size={16} />}
                {running ? "Processing…" : getRunLabel()}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Repo Selection */}
        <div className="saas-card flex flex-col h-[min(calc(100vh-140px),800px)]">
          <div className="saas-card-header border-b bg-[hsl(var(--muted))] p-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base">
                Repositories <span className="text-[hsl(var(--muted-foreground))] text-sm font-normal">({allRepos.length})</span>
              </h3>
              <button
                onClick={() => refetchRepos()}
                disabled={reposFetching || !activeOrg}
                className="p-1 rounded-md text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--background))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-50"
                title="Refresh Repositories"
              >
                <RefreshCw size={14} className={reposFetching ? "animate-spin" : ""} />
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedAll}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="rounded border-[hsl(var(--border))] accent-[hsl(var(--foreground))]"
              />
              Select All
            </label>
          </div>

          <div className="p-3 border-b border-[hsl(var(--border))]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                value={repoSearch}
                onChange={(e) => setRepoSearch(e.target.value)}
                placeholder="Filter repos..."
                className="w-full pl-9 pr-4 py-2 rounded-md border text-sm bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-[hsl(var(--background))]">
            {reposLoading && !reposFetching && (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-[hsl(var(--muted))] animate-pulse rounded-md" />
                ))}
              </div>
            )}

            {!reposLoading && reposError && (
              <div className="text-center p-8 text-rose-500 text-sm">
                <XCircle size={16} className="mx-auto mb-2 text-rose-400" />
                <p className="font-medium">Failed to load repositories</p>
                <p className="text-xs mt-1 text-rose-400/80">{getErrorMessage(reposError)}</p>
              </div>
            )}

            {!reposLoading && !reposError && allRepos.length === 0 && activeOrg && (
              <div className="text-center p-8 text-[hsl(var(--muted-foreground))] text-sm">
                No repositories found.
              </div>
            )}

            {!reposLoading && filteredRepos.length > 0 && (
              <div className="space-y-1">
                {filteredRepos.map((repo: Repository) => (
                  <RepoRow
                    key={repo.fullName}
                    repo={repo}
                    itemType={itemType}
                    isSelected={selectedRepos.has(repo.name)}
                    toggleRepo={() => toggleRepo(repo.name)}
                    result={results[repo.name]}
                    running={running}
                    onItemClick={handleItemClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
