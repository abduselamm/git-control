"use client";
// Hotfix: Force re-sync of imports


import { useState, useMemo } from "react";
import { 
  PlayCircle, CheckCircle2, XCircle, Clock, Eye, EyeOff, Search, 
  ChevronDown, ChevronRight, Loader2, RefreshCw 
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store/useStore";
import { OrgInput } from "@/components/shared/OrgInput";
import { 
  useOrgRepos, 
  useBulkPropagateVariable, 
  useBulkPropagateSecret, 
  useRepoVariables, 
  useRepoSecrets,
  useBulkDeleteVariable,
  useBulkDeleteSecret
} from "@/hooks/useGitOperations";
import type { Repository } from "@/lib/types";

type ItemType = "variable" | "secret";
type ActionType = "upsert" | "delete";
type ResultStatus = "pending" | "success" | "error";

interface PropagateResult {
  repo: string;
  status: ResultStatus;
  message?: string;
}

function RepoRowDetails({ repo, itemType }: { repo: Repository, itemType: "variable" | "secret" }) {
  const parts = repo.fullName.split("/");
  const owner = parts[0] || "";
  const name = parts.slice(1).join("/");

  const { data: vData, isLoading: vLoad } = useRepoVariables(owner, name);
  const { data: sData, isLoading: sLoad } = useRepoSecrets(owner, name);

  const variablesArray: any[] = Array.isArray(vData) ? vData : (vData as any)?.variables ?? [];
  const secretsArray: any[] = Array.isArray(sData) ? sData : (sData as any)?.secrets ?? [];

  const items = itemType === "variable" ? variablesArray : secretsArray;
  const isLoading = itemType === "variable" ? vLoad : sLoad;

  if (isLoading) {
    return <div className="py-3 px-10 flex"><Loader2 size={14} className="animate-spin text-[hsl(var(--muted-foreground))]" /></div>;
  }

  if (items.length === 0) {
    return <div className="py-3 px-10 text-xs text-[hsl(var(--muted-foreground))]">No existing {itemType}s found for this repository.</div>;
  }

  return (
    <div className="py-3 px-10 bg-[hsl(var(--muted))/30] border-t border-[hsl(var(--border))]">
      <div className="flex flex-wrap gap-2">
        {items.map((item: any) => {
          const itemName = item.name || item.key;
          return (
            <span key={itemName} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
              {itemName}
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
  running 
}: { 
  repo: Repository;
  itemType: "variable" | "secret";
  isSelected: boolean;
  toggleRepo: () => void;
  result?: PropagateResult;
  running: boolean;
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
          <span className="flex items-center pl-2 shrink-0">
            {result.status === "success" && (
              <div className="flex items-center gap-2">
                {result.message && (
                  <span className="text-[10px] font-medium text-amber-500/80 px-1.5 py-0.5 rounded bg-amber-500/5 border border-amber-500/10">
                    {result.message}
                  </span>
                )}
                <CheckCircle2 size={16} className={result.message ? "text-amber-500/50" : "text-emerald-500"} />
              </div>
            )}
            {result.status === "error" && <span title={result.message}><XCircle size={16} className="text-rose-500" /></span>}
            {result.status === "pending" && running && <Clock size={16} className="text-amber-500 animate-pulse" />}
          </span>
        )}

      </div>

      {expanded && (
        <RepoRowDetails repo={repo} itemType={itemType} />
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
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  
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

  const filteredRepos = useMemo(() => 
    allRepos.filter(r => r.name.toLowerCase().includes(repoSearch.toLowerCase())),
    [allRepos, repoSearch]
  );

  const selectedAll = filteredRepos.length > 0 && 
    filteredRepos.every((r) => selectedRepos.has(r.name));

  function toggleSelectAll(checked: boolean) {
    const next = new Set(selectedRepos);
    if (checked) {
      filteredRepos.forEach((r) => next.add(r.name));
    } else {
      filteredRepos.forEach((r) => next.delete(r.name));
    }
    setSelectedRepos(next);
  }

  function toggleRepo(name: string) {
    const next = new Set(selectedRepos);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedRepos(next);
  }

  async function handleRun() {
    if (selectedRepos.size === 0 || !key || (action === "upsert" && !value)) return;

    setRunning(true);
    const targetReposArray = allRepos.filter((r) => selectedRepos.has(r.name));
    const targetRepos = targetReposArray.map(r => r.name);
    
    const initialResults: Record<string, PropagateResult> = {};
    for (const repo of targetRepos) {
      initialResults[repo] = { repo, status: "pending" };
    }
    setResults({ ...initialResults });

    try {
       let bulkResult: PromiseSettledResult<any>[];
       
       if (action === "upsert") {
           if (itemType === "variable") {
              bulkResult = await propagateVar.mutateAsync({ repos: targetReposArray, key, value, masked: false });
           } else {
              bulkResult = await propagateSec.mutateAsync({ repos: targetReposArray, name: key, value });
           }
       } else {
           if (itemType === "variable") {
              bulkResult = await deleteVar.mutateAsync({ repos: targetReposArray, key });
           } else {
              bulkResult = await deleteSec.mutateAsync({ repos: targetReposArray, name: key });
           }
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
                 next[repoName] = { repo: repoName, status: "error", message: res.reason?.message || "Failed" };
              }
           });

          return next;
       });

    } catch (e: unknown) {
       console.error("Bulk process failed", e);
    }
    setRunning(false);
  }

  function getErrorMessage(err: any): string {
    if (!err) return "";
    const status = err.response?.status;
    const data = err.response?.data;

    if (status === 401) return "Invalid or missing token. Please check your settings.";
    if (status === 404) return "Organization, group, or user not found.";
    if (status === 403) return "Rate limit exceeded or permission denied.";
    
    return data?.message || err.message || "An unexpected error occurred.";
  }

  const accent = platform === "github" ? "hsl(var(--foreground))" : "var(--accent-gitlab)";
  const bgAccent = platform === "github" ? "hsl(var(--background))" : "#fff";

  return (
    <div className="flex-1 space-y-6 fade-in max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Bulk Propagate</h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Push a variable or secret to multiple repositories in a single operation
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

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">Type</label>
                  <div className="flex p-1 rounded-lg border bg-[hsl(var(--muted))]">
                    {(["variable", "secret"] as ItemType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setItemType(t)}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                          itemType === t ? "shadow" : "hover:bg-[hsl(var(--background))/50]"
                        }`}
                        style={
                          itemType === t
                            ? { background: accent, color: bgAccent }
                            : { color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">
                  Key / Name
                </label>
                <input
                  id="bulk-key"
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase().replace(/\s/g, "_"))}
                  placeholder="MY_KEY"
                  className="w-full px-3 py-2 rounded-md text-sm font-mono border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {action === "upsert" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--foreground))]">
                    Value
                  </label>
                  <div className="relative">
                    <input
                      id="bulk-value"
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
            </div>
            
            <div className="saas-card-footer mt-4">
              <button
                onClick={handleRun}
                disabled={running || !key || (action === "upsert" && !value) || !activeOrg || selectedRepos.size === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium shadow-sm transition-opacity disabled:opacity-50"
                style={action === "delete" ? { background: "hsl(var(--destructive))", color: "white" } : { background: accent, color: bgAccent }}
              >
                <PlayCircle size={16} />
                {running ? "Processing…" : `${action === "upsert" ? "Propagate to" : "Delete from"} ${selectedRepos.size} repo${selectedRepos.size !== 1 ? "s" : ""}`}
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
                {filteredRepos.map((repo) => {
                  return (
                    <RepoRow
                      key={repo.name}
                      repo={repo}
                      itemType={itemType}
                      isSelected={selectedRepos.has(repo.name)}
                      toggleRepo={() => toggleRepo(repo.name)}
                      result={results[repo.name]}
                      running={running}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
