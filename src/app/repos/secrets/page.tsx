"use client";

import { useState } from "react";
import { Plus, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/useStore";
import {
  useRepoSecrets,
  useCreateOrUpdateRepoSecret,
  useDeleteRepoSecret,
} from "@/hooks/useGitOperations";
import { DataTable } from "@/components/shared/DataTable";
import { ItemForm, type ItemFormData } from "@/components/shared/ItemForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { RepoInput } from "@/components/shared/RepoInput";

export default function RepoSecretsPage() {
  const { platform } = useAppStore();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const { data, isLoading, refetch } = useRepoSecrets(owner, repo);
  const createMut = useCreateOrUpdateRepoSecret(owner, repo);
  const deleteMut = useDeleteRepoSecret(owner, repo);

  const secretsArray: any[] = Array.isArray(data) ? data : (data as any)?.secrets ?? [];
  const filtered = secretsArray.filter((s) =>
    "name" in s
      ? (s.name as string).toLowerCase().includes(search.toLowerCase())
      : (s as { key: string }).key.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(fd: ItemFormData) {
    try {
      await createMut.mutateAsync({ name: fd.key, value: fd.value });
      toast.success(`Secret "${fd.key}" saved`);
      setFormOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    }
  }

  async function handleDelete() {
    if (!deleteKey) return;
    try {
      await deleteMut.mutateAsync(deleteKey);
      toast.success(`Secret "${deleteKey}" deleted`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteKey(null);
    }
  }

  return (
    <div className="flex-1 space-y-6 fade-in max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Repository Secrets</h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Manage {platform === "github" ? "encrypted Actions secrets" : "masked CI/CD variables"} for a repository.
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {/* Context Selection Card */}
        <div className="saas-card overflow-hidden">
          <div className="p-1 items-center bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
            <div className="px-4 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
               Target Selection
            </div>
          </div>
          <div className="saas-card-content pt-6">
            <RepoInput owner={owner} repo={repo} setOwner={setOwner} setRepo={setRepo} />
          </div>
        </div>

        {/* Data Card */}
        <div className="saas-card overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b bg-[hsl(var(--background))] p-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Secrets List</h3>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              {owner && repo && (
                <div className="flex-1 md:w-56">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search secrets…" id="search-secrets" />
                </div>
              )}
              <button
                onClick={() => refetch()}
                disabled={!owner || !repo || isLoading}
                className="p-2.5 rounded-md border bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors disabled:opacity-50 shrink-0"
                title="Refresh"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setFormOpen(true)}
                disabled={!owner || !repo}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 shrink-0"
                style={{
                  background: "var(--accent-purple)",
                  color: "#fff",
                }}
              >
                <Plus size={16} />
                New Secret
              </button>
            </div>
          </div>
          <div className="p-0 bg-[hsl(var(--background))]">
            {!owner || !repo ? (
              <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
                <Shield size={48} className="mb-4 opacity-20" strokeWidth={1} />
                <p className="text-sm font-medium">Select a repository first</p>
                <p className="text-xs mt-1 opacity-70">Enter an owner and repository name above to view secrets.</p>
              </div>
            ) : (
              <DataTable
                rows={filtered}
                type="secret"
                loading={isLoading}
                onDelete={(name) => setDeleteKey(name)}
                emptyLabel="No repository secrets found. Click New Secret to create one."
              />
            )}
          </div>
        </div>
      </div>

      <ItemForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={createMut.isPending}
        mode="create"
        itemType="secret"
      />

      <ConfirmDialog
        isOpen={!!deleteKey}
        title="Delete Secret"
        message={`Are you sure you want to delete "${deleteKey}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteKey(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
