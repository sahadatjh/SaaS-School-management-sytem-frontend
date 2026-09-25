"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePortal } from "@/components/portal-context";
import type { InstitutionRole, PermissionCatalogItem, RoleUser } from "@/lib/contracts";
import { portalApi } from "@/lib/portal-api";

type Tab = "roles" | "users";

export default function RolesSettingsPage() {
  const { profile, refreshProfile } = usePortal();
  const [tab, setTab] = useState<Tab>("roles");
  const [roles, setRoles] = useState<InstitutionRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionCatalogItem[]>([]);
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [editing, setEditing] = useState<InstitutionRole | null | undefined>(undefined);
  const [assigning, setAssigning] = useState<RoleUser | null>(null);
  const [deleting, setDeleting] = useState<InstitutionRole | null>(null);
  const [viewing, setViewing] = useState<InstitutionRole | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextRoles, nextPermissions, nextUsers] = await Promise.all([
        portalApi.roles.list(),
        portalApi.roles.permissions(),
        portalApi.roles.users(new URLSearchParams({ page: String(page), limit: "20", ...(search ? { search } : {}) })),
      ]);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
      setUsers(nextUsers.items);
      setUserTotal(nextUsers.pagination.total);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load role settings.");
    }
  }, [page, search]);

  useEffect(() => { void load(); }, [load]);

  if (!profile?.permissions.includes("roles.manage")) {
    return <Card className="max-w-2xl p-6"><h1 className="text-xl font-bold text-slate-950">Roles & Permissions</h1><p className="mt-2 text-sm text-slate-600">Only an Institute Admin can manage roles and permissions.</p></Card>;
  }

  const assignableRoles = roles.filter((role) => !["Student", "Guardian"].includes(role.name));
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-orange-600">Settings</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Roles & Permissions</h1></div>
        {tab === "roles" && <Button onClick={() => setEditing(null)}><Plus className="mr-2 size-4" />Create custom role</Button>}
      </div>
      {error && <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</Card>}
      <div className="flex gap-2 border-b">
        {(["roles", "users"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === item ? "border-orange-600 text-orange-600" : "border-transparent text-slate-500"}`}>{item === "roles" ? "Roles" : "User Assignments"}</button>)}
      </div>
      {tab === "roles" ? <RolesTab roles={roles} onEdit={setEditing} onDelete={setDeleting} onView={setViewing} /> : <UsersTab users={users} search={search} total={userTotal} page={page} onSearch={(value) => { setSearch(value); setPage(1); }} onPage={setPage} onAssign={setAssigning} />}
      {editing !== undefined && <RoleDialog role={editing} permissions={permissions} onClose={() => setEditing(undefined)} onSave={async (payload) => { setWorking(true); try { editing ? await portalApi.roles.update(editing.id, payload) : await portalApi.roles.create(payload); setEditing(undefined); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save role."); } finally { setWorking(false); } }} working={working} />}
      {assigning && <AssignmentDialog user={assigning} roles={assignableRoles} onClose={() => setAssigning(null)} onSave={async (roleIds) => { setWorking(true); try { await portalApi.roles.assign(assigning.id, roleIds); setAssigning(null); await Promise.all([load(), refreshProfile()]); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save role assignments."); } finally { setWorking(false); } }} working={working} />}
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete custom role?" description={deleting ? `Delete ${deleting.name}? Reassign users first if it is in use.` : ""} confirmLabel="Delete role" isLoading={working} onConfirm={async () => { if (!deleting) return; setWorking(true); try { await portalApi.roles.delete(deleting.id); setDeleting(null); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete role."); } finally { setWorking(false); } }} />
      {viewing && <Modal title={`${viewing.name} permissions`} onClose={() => setViewing(null)}><div className="space-y-2 text-sm text-slate-700">{viewing.permissionCodes.length ? viewing.permissionCodes.map((code) => <p key={code} className="rounded bg-slate-50 px-3 py-2">{code}</p>) : <p>No permissions assigned.</p>}</div></Modal>}
    </div>
  );
}

function RolesTab({ roles, onEdit, onDelete, onView }: { roles: InstitutionRole[]; onEdit: (role: InstitutionRole) => void; onDelete: (role: InstitutionRole) => void; onView: (role: InstitutionRole) => void }) {
  return <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Role</th><th className="p-4">Permissions</th><th className="p-4">Assigned users</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{roles.map((role) => <tr key={role.id} className="border-t"><td className="p-4 font-semibold text-slate-900"><span className="flex items-center gap-2">{role.name}{role.isSystem && <Lock className="size-3.5 text-slate-400" />}</span></td><td className="p-4 text-slate-600">{role.permissionCodes.length}</td><td className="p-4 text-slate-600">{role.assignedUserCount}</td><td className="p-4 text-right"><span className="inline-flex gap-2"><Button size="sm" variant="outline" onClick={() => onView(role)}>View</Button>{role.isSystem ? <span className="self-center text-xs text-slate-400">Locked</span> : <><Button size="sm" variant="outline" onClick={() => onEdit(role)}><Pencil className="mr-1 size-3" />Edit</Button><Button size="sm" variant="destructive" onClick={() => onDelete(role)}>Delete</Button></>}</span></td></tr>)}</tbody></table></div></Card>;
}

function UsersTab({ users, search, total, page, onSearch, onPage, onAssign }: { users: RoleUser[]; search: string; total: number; page: number; onSearch: (value: string) => void; onPage: (page: number) => void; onAssign: (user: RoleUser) => void }) {
  return <Card className="p-5"><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search user email" className="mb-4 max-w-sm" /><div className="space-y-3">{users.map((user) => <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{user.email}</p><p className="mt-1 text-sm text-slate-500">{user.roles.map((role) => role.name).join(", ") || "No roles assigned"}</p></div><Button size="sm" variant="outline" onClick={() => onAssign(user)}><Users className="mr-1 size-3" />Assign roles</Button></div>)}{!users.length && <p className="py-8 text-center text-sm text-slate-500">No active school users found.</p>}</div><div className="mt-5 flex items-center justify-between text-sm text-slate-500"><span>{total} users</span><span className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={users.length < 20} onClick={() => onPage(page + 1)}>Next</Button></span></div></Card>;
}

function RoleDialog({ role, permissions, onClose, onSave, working }: { role: InstitutionRole | null; permissions: PermissionCatalogItem[]; onClose: () => void; onSave: (payload: { name: string; permissionCodes: string[] }) => Promise<void>; working: boolean }) {
  const [name, setName] = useState(role?.name ?? "");
  const [selected, setSelected] = useState<string[]>(role?.permissionCodes ?? []);
  const grouped = useMemo(() => Object.groupBy(permissions, (permission) => permission.module), [permissions]);
  async function submit(event: FormEvent) { event.preventDefault(); await onSave({ name, permissionCodes: selected }); }
  return <Modal title={role ? `Edit ${role.name}` : "Create custom role"} onClose={onClose}><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Role name<Input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2" placeholder="Exam Coordinator" /></label><div className="max-h-72 space-y-4 overflow-y-auto">{Object.entries(grouped).map(([module, items]) => <fieldset key={module}><legend className="mb-2 text-sm font-semibold capitalize text-slate-800">{module}</legend><div className="grid gap-2 sm:grid-cols-2">{items?.map((permission) => <label key={permission.code} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={selected.includes(permission.code)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, permission.code] : current.filter((code) => code !== permission.code))} />{permission.displayName}</label>)}</div></fieldset>)}</div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={working}>{working ? "Saving..." : "Save role"}</Button></div></form></Modal>;
}

function AssignmentDialog({ user, roles, onClose, onSave, working }: { user: RoleUser; roles: InstitutionRole[]; onClose: () => void; onSave: (roleIds: string[]) => Promise<void>; working: boolean }) {
  const [selected, setSelected] = useState(user.roles.filter((role) => roles.some((item) => item.id === role.id)).map((role) => role.id));
  return <Modal title={`Assign roles: ${user.email}`} onClose={onClose}><form onSubmit={async (event) => { event.preventDefault(); await onSave(selected); }} className="space-y-3"><div className="max-h-72 space-y-2 overflow-y-auto">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 rounded border p-3 text-sm"><input type="checkbox" checked={selected.includes(role.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, role.id] : current.filter((id) => id !== role.id))} />{role.name}{role.isSystem && <Lock className="size-3 text-slate-400" />}</label>)}</div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={working}>{working ? "Saving..." : "Save assignments"}</Button></div></form></Modal>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><Card className="w-full max-w-2xl p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-950">{title}</h2><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></div>{children}</Card></div>; }
