"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ActionTooltip } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/status-badge";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ClassDialog } from "@/components/academic/class-dialog";
import { useListQuery } from "@/hooks/use-list-query";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type { Class } from "@/lib/contracts";

export default function ClassesPage() {
	const [classes, setClasses] = useState<Class[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Class | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [formTarget, setFormTarget] = useState<Class | null | undefined>(undefined);
	const { sortState, requestSort, search, setSearch, debouncedSearch } = useListQuery("numeric_value", "asc");

	const loadClasses = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams();
			if (sortState.sortBy) params.set("sort_by", sortState.sortBy);
			if (sortState.sortOrder) params.set("sort_order", sortState.sortOrder);
			if (debouncedSearch) params.set("search", debouncedSearch);
			setClasses(await portalApi.classes.list(params));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Unable to load classes.");
		} finally {
			setLoading(false);
		}
	}, [debouncedSearch, sortState.sortBy, sortState.sortOrder]);

	useEffect(() => {
		void Promise.resolve().then(loadClasses);
	}, [loadClasses]);

	const activeCount = useMemo(() => classes.filter((item) => item.is_active).length, [classes]);

	async function handleDeleteConfirm() {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await portalApi.classes.delete(deleteTarget.id);
			setDeleteTarget(null);
			toast.success(`Class "${deleteTarget.name}" deleted successfully.`);
			await loadClasses();
		} catch (cause) {
			toast.error(cause instanceof Error ? cause.message : "Unable to delete class.");
		} finally {
			setIsDeleting(false);
		}
	}

	function handleFormSaved() {
		setFormTarget(undefined);
		void loadClasses();
	}

	return (
		<div className="flex h-full w-full flex-col">
			<nav aria-label="Breadcrumb" className="mb-2.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
				<span>Academic</span>
				<span className="text-slate-300">/</span>
				<span className="font-semibold text-slate-800">Classes</span>
			</nav>

			<Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-slate-200/90 shadow-xs">
				<div className="flex shrink-0 flex-col items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row">
					<div className="flex items-center gap-2.5 self-start sm:self-auto">
						<h1 className="text-base font-bold text-slate-900">Classes</h1>
						<span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{classes.length}</span>
						<span className="hidden text-xs text-slate-400 sm:inline">{activeCount} active</span>
					</div>

					<div className="flex w-full items-center gap-2.5 sm:w-auto">
						<div className="relative flex-1 sm:w-64">
							<Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
							<Input placeholder="Filter classes..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 border-slate-200 bg-slate-50/70 pl-8 pr-8 text-xs transition-colors focus:bg-white" />
							{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600" aria-label="Clear filter"><X className="size-3.5" /></button>}
						</div>
						<Button type="button" size="sm" onClick={() => setFormTarget(null)} className="h-9 shrink-0 bg-orange-600 px-3.5 text-xs font-semibold hover:bg-orange-700"><Plus className="mr-1.5 size-3.5" />New Class</Button>
					</div>
				</div>

				{error ? (
					<div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
						<AlertCircle className="mb-2.5 size-9 text-rose-500" />
						<p className="text-sm font-bold text-slate-900">Failed to load classes</p>
						<p className="mt-1 max-w-sm text-xs text-slate-500">{error}</p>
						<Button variant="outline" size="sm" onClick={loadClasses} className="mt-3.5 h-8 text-xs">Retry</Button>
					</div>
				) : loading ? (
					<div className="flex flex-1 items-center justify-center text-sm text-slate-400">Loading classes...</div>
				) : classes.length === 0 ? (
					<EmptyState icon={Building2} title={search ? "No matching classes" : "No classes configured"} description={search ? "Try a different filter." : "Create your first class to begin setting up sections and groups."} action={!search ? <Button type="button" size="sm" onClick={() => setFormTarget(null)} className="bg-orange-600 hover:bg-orange-700"><Plus className="mr-1.5 size-3.5" />Create Class</Button> : undefined} />
				) : (
					<div className="flex-1 overflow-auto bg-slate-50/30">
						<table className="w-full border-collapse text-left text-sm">
							<thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-xs">
								<tr>
									<SortableHeader columnKey="name" title="Class" sortState={sortState} onRequestSort={requestSort} />
									<SortableHeader columnKey="numeric_value" title="Order" sortState={sortState} onRequestSort={requestSort} />
									<SortableHeader columnKey="is_active" title="Status" sortState={sortState} onRequestSort={requestSort} />
									<th scope="col" className="px-5 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{classes.map((classRecord) => (
									<tr key={classRecord.id} className="transition-colors hover:bg-slate-50/80">
										<td className="px-5 py-3 font-semibold text-slate-900">{classRecord.name}</td>
										<td className="px-5 py-3 text-xs text-slate-600">{classRecord.numeric_value ?? "-"}</td>
										<td className="px-5 py-3"><StatusBadge isActive={classRecord.is_active} /></td>
										<td className="px-5 py-3 text-right">
											<div className="inline-flex items-center justify-end gap-1">
												<ActionTooltip content="Edit"><Button type="button" variant="ghost" size="icon" onClick={() => setFormTarget(classRecord)} className="size-7 text-slate-500 hover:bg-orange-50 hover:text-orange-600" aria-label={`Edit ${classRecord.name}`}><Pencil className="size-3.5" /></Button></ActionTooltip>
												<ActionTooltip content="Delete"><Button type="button" variant="ghost" size="icon" onClick={() => setDeleteTarget(classRecord)} className="size-7 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${classRecord.name}`}><Trash2 className="size-3.5" /></Button></ActionTooltip>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Delete Class" description={`Are you sure you want to delete "${deleteTarget?.name}"? Classes with linked sections or groups cannot be deleted.`} confirmLabel="Delete" variant="destructive" isLoading={isDeleting} onConfirm={handleDeleteConfirm} />
			<ClassDialog key={`${formTarget?.id ?? "new"}-${formTarget !== undefined ? "open" : "closed"}`} open={formTarget !== undefined} classRecord={formTarget ?? undefined} onOpenChange={(open) => { if (!open) setFormTarget(undefined); }} onSaved={handleFormSaved} />
		</div>
	);
}
