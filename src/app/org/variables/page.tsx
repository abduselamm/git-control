"use client";

import { useState } from "react";
import { Plus, RefreshCw, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store/useStore";
import {
  useOrgVariables,
  useCreateOrgVariable,
  useUpdateOrgVariable,
  useDeleteOrgVariable,
} from "@/hooks/useGitOperations";
import { DataTable } from "@/components/shared/DataTable";
import { ItemForm, type ItemFormData } from "@/components/shared/ItemForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchInput } from "@/components/shared/SearchInput";
import { OrgInput } from "@/components/shared/OrgInput";
import type { Variable } from "@/lib/types";

export default function OrgVariablesPage() {
  const { platform, activeOrg, setActiveOrg } = useAppStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Variable | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const { data, isLoading, refetch } = useOrgVariables(activeOrg);
  const createMut = useCreateOrgVariable(activeOrg);
  const updateMut = useUpdateOrgVariable(activeOrg);
  const deleteMut = useDeleteOrgVariable(activeOrg);

  const variablesArray: any[] = Array.isArray(data) ? data : (data as any)?.variables ?? [];
  const filtered = variablesArray.filter((v) =>
    v.key.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(fd: ItemFormData) {
    try {
      if (editRow) {
        await updateMut.mutateAsync({ key: fd.key, value: fd.value, masked: fd.masked });
        toast.success(`Variable "${fd.key}" updated`);
      } else {
        await createMut.mutateAsync({ key: fd.key, value: fd.value, masked: fd.masked, visibility: fd.visibility });
        toast.success(`Variable "${fd.key}" created`);
      }
      setFormOpen(false);
      setEditRow(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    }
  }

  async function handleDelete() {
    if (!deleteKey) return;
    try {
      await deleteMut.mutateAsync(deleteKey);
      toast.success(`Variable "${deleteKey}" deleted`);
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
          <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            {platform === "github" ? "Organization" : "Group"} Variables
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Variables shared at the {platform === "github" ? "organization" : "group"} level
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
            <OrgInput org={activeOrg} setOrg={setActiveOrg} />
          </div>
        </div>

        {/* Data Card */}
        <div className="saas-card overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b bg-[hsl(var(--background))] p-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">Variables List</h3>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              {activeOrg && (
                <div className="flex-1 md:w-56">
                  <SearchInput value={search} onChange={setSearch} placeholder="Search variables…" id="search-org-variables" />
                </div>
              )}
              <button
                onClick={() => refetch()}
                disabled={!activeOrg || isLoading}
                className="p-2.5 rounded-md border bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors disabled:opacity-50 shrink-0"
                title="Refresh"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => { setEditRow(null); setFormOpen(true); }}
                disabled={!activeOrg}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 shrink-0"
                style={{
                  background: platform === "github" ? "hsl(var(--foreground))" : "var(--accent-gitlab)",
                  color: platform === "github" ? "hsl(var(--background))" : "#fff",
                }}
              >
                <Plus size={16} />
                New Variable
              </button>
            </div>
          </div>
          <div className="p-0 bg-[hsl(var(--background))]">
            {!activeOrg ? (
              <div className="flex flex-col items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
                <Building2 size={48} className="mb-4 opacity-20" strokeWidth={1} />
                <p className="text-sm font-medium">Select an organization first</p>
                <p className="text-xs mt-1 opacity-70">Enter an organization name above to view variables.</p>
              </div>
            ) : (
              <DataTable
                rows={filtered}
                type="variable"
                loading={isLoading}
                onEdit={(row) => { setEditRow(row as Variable); setFormOpen(true); }}
                onDelete={(key) => setDeleteKey(key)}
                emptyLabel="No organization variables found."
              />
            )}
          </div>
        </div>
      </div>

      <ItemForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditRow(null); }}
        onSubmit={handleSubmit}
        loading={createMut.isPending || updateMut.isPending}
        initialData={editRow ?? undefined}
        mode={editRow ? "edit" : "create"}
        itemType="variable"
        isOrgLevel
      />

      <ConfirmDialog
        isOpen={!!deleteKey}
        title="Delete Org Variable"
        message={`Delete "${deleteKey}"? This will affect all repositories using this variable.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteKey(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
