'use client'

import { FormEvent, useEffect, useState } from "react"
import { type AuthUser, type UserRole } from '@/lib/data'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Edit,
  Mail,
  Settings,
  Star,
  Users,
  CreditCard,
  Download,
  FileText,
  Package,
  RefreshCw,
  Zap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ===== Groups: data layer =====

export type GroupRole = "owner" | "admin" | "member"

type Group = { id: string; name: string; created_at: string; myRole: GroupRole }
type Member = { user_id: string; role: GroupRole; created_at: string; email: string | null }
type ShareResult = { leads: number; uploads: number; tulsa: number; contacts: number }

const ERROR_MESSAGES: Record<string, string> = {
  "not allowed": "Only group owners and admins can do that.",
  "no user with that email": "No account exists with that email yet.",
  "role must be member or admin": "Choose either Member or Admin.",
  "group name must be 1 to 100 characters": "Group name must be 1 to 100 characters.",
  "not authenticated": "Please sign in again.",
}

function friendlyError(err: { message?: string } | null | undefined): string {
  const msg = err?.message ?? "Something went wrong."
  return ERROR_MESSAGES[msg] ?? msg
}

async function getMyGroups(supabase: ReturnType<typeof createClient>): Promise<Group[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []
  const { data, error } = await supabase
    .from("group_members")
    .select("role, groups(id, name, created_at)")
    .eq("user_id", auth.user.id)
  if (error) throw error
  return (data ?? [])
    .map((row: any) => {
      const g = Array.isArray(row.groups) ? row.groups[0] : row.groups
      return g ? ({ ...g, myRole: row.role } as Group) : null
    })
    .filter((g: Group | null): g is Group => g !== null)
    .sort((a: Group, b: Group) => a.created_at.localeCompare(b.created_at))
}

async function getMembers(supabase: ReturnType<typeof createClient>, groupId: string): Promise<Member[]> {
  const { data: members, error } = await supabase
    .from("group_members")
    .select("user_id, role, created_at")
    .eq("group_id", groupId)
    .order("created_at")
  if (error) throw error
  const typedMembers = (members ?? []) as { user_id: string; role: GroupRole; created_at: string }[]
  if (!typedMembers.length) return []

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", typedMembers.map((m) => m.user_id))
  if (pErr) throw pErr
  const emailById = new Map((profiles ?? []).map((p: { id: string; email: string | null }) => [p.id, p.email as string]))
  return typedMembers.map((m) => ({ ...m, email: emailById.get(m.user_id) ?? null })) as Member[]
}

async function createGroup(supabase: ReturnType<typeof createClient>, name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_group", { p_name: name })
  if (error) throw error
  return data as string
}

async function addMember(
  supabase: ReturnType<typeof createClient>,
  groupId: string,
  email: string,
  role: "member" | "admin"
) {
  const { error } = await supabase.rpc("add_group_member", {
    p_group_id: groupId,
    p_email: email.trim(),
    p_role: role,
  })
  if (error) throw error
}

async function removeMember(supabase: ReturnType<typeof createClient>, groupId: string, userId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("user_id")
  if (error) throw error
  if (!data?.length) throw new Error("not allowed")
}

async function renameGroup(supabase: ReturnType<typeof createClient>, groupId: string, name: string) {
  const { data, error } = await supabase
    .from("groups")
    .update({ name: name.trim() })
    .eq("id", groupId)
    .select("id")
  if (error) throw error
  if (!data?.length) throw new Error("not allowed")
}

async function countPersonalLeads(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { count, error } = await supabase
    .from("property_leads")
    .select("id", { count: "exact", head: true })
    .is("group_id", null)
  if (error) throw error
  return count ?? 0
}

async function shareMyData(
  supabase: ReturnType<typeof createClient>,
  groupId: string
): Promise<ShareResult> {
  const { data, error } = await supabase.rpc("share_my_data_with_group", { p_group_id: groupId })
  if (error) throw error
  return data as ShareResult
}

// ===== end Groups data layer =====

interface AdminAccessPanelProps {
  users: AuthUser[]
  currentUserId: string
  onRoleChange: (userId: string, role: UserRole) => void
}

const invoices = [
  {
    id: "INV-001",
    date: "Mar 1, 2024",
    amount: "$29.00",
    status: "Paid",
  },
  {
    id: "INV-002",
    date: "Feb 1, 2024",
    amount: "$29.00",
    status: "Paid",
  },
  {
    id: "INV-003",
    date: "Jan 1, 2024",
    amount: "$29.00",
    status: "Paid",
  },
];

export function AdminAccessPanel({ users, currentUserId, onRoleChange }: AdminAccessPanelProps) {
  const currentUser = users.find((user) => user.id === currentUserId);
  const [notice, setNotice] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [appMode, setAppMode] = useState<'wholesale' | 'mortgage-rescue'>('wholesale');

  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [personalCount, setPersonalCount] = useState<number>(0);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [groupsNotice, setGroupsNotice] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteGroupEmail, setInviteGroupEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [renameValue, setRenameValue] = useState("");
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | {
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>(null);

  const supabase = createClient();
  const myId = currentUserId;
  const active = groups.find((g) => g.id === activeId) ?? null;
  const canManage = active?.myRole === "owner" || active?.myRole === "admin";

  const currentUserInitials = currentUser ? getInitials(currentUser.name) : "U";
  const currentUserDisplay = currentUser?.name ?? "Current User";
  const currentUserEmail = currentUser?.email ?? "user@example.com";

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const groupNotify = (message: string) => {
    setGroupsNotice(message);
    window.setTimeout(() => setGroupsNotice(""), 4000);
  };

  const sendInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!inviteEmail) return;
    notify("Invitation sent to " + inviteEmail);
    setInviteEmail("");
    setShowInvite(false);
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText("https://join.maligroup.com/design-team");
    notify("Invite link copied");
  };

  // ===== Groups logic =====

  const loadGroups = async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const list = await getMyGroups(supabase);
      setGroups(list);
      let saved: string | null = null;
      try { saved = localStorage.getItem("activeGroupId"); } catch {}
      setActiveId(saved && list.some((g) => g.id === saved) ? saved : list[0]?.id ?? null);
      if (list.length === 0) {
        setPersonalCount(0);
      }
    } catch (e: any) {
      setGroupsError(friendlyError(e));
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadMembers = async (groupId: string) => {
    try {
      setMembers(await getMembers(supabase, groupId));
    } catch (e: any) {
      setGroupsError(friendlyError(e));
    }
  };

  const loadPersonalCount = async () => {
    try {
      setPersonalCount(await countPersonalLeads(supabase));
    } catch (e: any) {
      setGroupsError(friendlyError(e));
    }
  };

  useEffect(() => {
    void loadGroups();
    void loadPersonalCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId) {
      void loadMembers(activeId);
      setRenameValue(active?.name ?? "");
    } else {
      setMembers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const run = async (fn: () => Promise<void>, okMsg?: string) => {
    setGroupsError(null);
    setGroupsNotice(null);
    setActing(true);
    try {
      await fn();
      if (okMsg) groupNotify(okMsg);
    } catch (e: any) {
      setGroupsError(friendlyError(e));
    } finally {
      setActing(false);
    }
  };

  const onCreateGroup = (e: FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    run(async () => {
      const id = await createGroup(supabase, name);
      setNewGroupName("");
      await loadGroups();
      setActiveId(id);
    }, "Group created.");
  };

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!active || !inviteGroupEmail.trim()) return;
    run(async () => {
      await addMember(supabase, active.id, inviteGroupEmail, inviteRole);
      setInviteGroupEmail("");
      await loadMembers(active.id);
    }, "Member added.");
  };

  const onRename = (e: FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const name = renameValue.trim();
    if (!name) return;
    run(async () => {
      await renameGroup(supabase, active.id, name);
      await loadGroups();
    }, "Group renamed.");
  };

  const onRemoveMember = (userId: string) => {
    if (!active) return;
    const leaving = userId === myId;
    setConfirmAction({
      title: leaving ? "Leave group" : "Remove member",
      description: leaving
        ? "You will lose access to this group's records. Personal records stay with you."
        : "This member will lose access to the group's records.",
      onConfirm: async () => {
        await removeMember(supabase, active.id, userId);
        if (leaving) {
          await loadGroups();
        } else {
          await loadMembers(active.id);
        }
      },
    });
  };

  const onShareData = () => {
    if (!active) return;
    setConfirmAction({
      title: "Share your records with the group",
      description:
        "Your personal records will move into this group and become visible to every member. This cannot be undone from the UI.",
      onConfirm: async () => {
        const result = await shareMyData(supabase, active.id);
        await loadPersonalCount();
        groupNotify(
          `Shared ${result.leads} leads, ${result.uploads} uploads, ${result.tulsa} county records, ${result.contacts} contacts.`
        );
      },
    });
  };

  const selectGroup = (id: string) => {
    setActiveId(id);
    try { localStorage.setItem("activeGroupId", id); } catch {}
  };

  // ===== end Groups logic =====

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 2xl:max-w-[1400px]">
      {notice && (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-xl">
          <span className="grid size-5 place-items-center rounded-full bg-accent text-primary">
            <Star className="size-3" />
          </span>
          {notice}
        </div>
      )}

      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Role Access</h1>
          <p className="text-muted-foreground text-sm">
            Assign access levels for the people who use this workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 size-4" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 size-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={appMode === 'wholesale' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAppMode('wholesale')}
        >
          Wholesale
        </Button>
        <Button
          variant={appMode === 'mortgage-rescue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAppMode('mortgage-rescue')}
        >
          Mortgage Rescue
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <Avatar className="size-20">
                  <AvatarImage
                    src={currentUser?.picture ?? "https://github.com/shadcn.png"}
                    alt={currentUserDisplay}
                  />
                  <AvatarFallback>{currentUserInitials}</AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{currentUserDisplay}</h2>
                <p className="text-muted-foreground text-sm">{currentUserEmail}</p>
                <Badge className="mt-2" variant="secondary">
                  {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role ?? 'User'}
                </Badge>
                <Button className="mt-4 w-full" size="sm">
                  <Mail className="mr-2 size-4" />
                  Message
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="text-foreground">Jan 2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="text-foreground capitalize">{currentUser?.role ?? 'admin'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6 md:col-span-3">
          {/* Groups */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Groups</h3>
                  <p className="text-xs text-muted-foreground">
                    Groups are optional. Solo users only see their own records.
                  </p>
                </div>
              </div>

              {groupsError && (
                <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {groupsError}
                </div>
              )}
              {groupsNotice && (
                <div role="status" className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent-foreground">
                  {groupsNotice}
                </div>
              )}

              {groupsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="size-4 animate-spin" /> Loading groups...
                </div>
              ) : groups.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  You are working solo. Create a group below to share records with teammates.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => selectGroup(g.id)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          g.id === activeId
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground"
                        }`}
                      >
                        {g.name} <span className="opacity-60">({g.myRole})</span>
                      </button>
                    ))}
                  </div>

                  {active && (
                    <>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Active group: </span>
                        <span className="font-medium text-foreground">{active.name}</span>
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs capitalize">{active.myRole}</span>
                      </div>

                      {canManage && (
                        <form onSubmit={onRename} className="flex gap-2">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            maxLength={100}
                            aria-label="Group name"
                            disabled={acting}
                          />
                          <Button type="submit" variant="outline" size="sm" disabled={acting || !renameValue.trim()}>
                            Rename
                          </Button>
                        </form>
                      )}

                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Email</th>
                              <th className="px-3 py-2 text-left font-semibold">Role</th>
                              <th className="px-3 py-2 text-right font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {members.map((m) => {
                              const isOwner = m.role === "owner";
                              const isMe = m.user_id === myId;
                              const canRemove = !isOwner && (isMe || canManage);
                              return (
                                <tr key={m.user_id}>
                                  <td className="px-3 py-2">
                                    {m.email ?? m.user_id}
                                    {isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {canRemove && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={acting}
                                        onClick={() => onRemoveMember(m.user_id)}
                                      >
                                        {isMe ? "Leave" : "Remove"}
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {canManage && (
                        <form onSubmit={onInvite} className="flex flex-wrap items-end gap-2">
                          <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-foreground">Email</label>
                            <Input
                              type="email"
                              required
                              placeholder="teammate@example.com"
                              value={inviteGroupEmail}
                              onChange={(e) => setInviteGroupEmail(e.target.value)}
                              disabled={acting}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-foreground">Role</label>
                            <Select
                              value={inviteRole}
                              onValueChange={(v) => { if (v) setInviteRole(v as "member" | "admin"); }}
                              disabled={acting}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" variant="default" size="sm" disabled={acting}>
                            Add member
                          </Button>
                        </form>
                      )}

                      {personalCount > 0 && (
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <p className="text-sm font-medium text-foreground">
                            You have {personalCount} personal record{personalCount === 1 ? "" : "s"}.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sharing moves them into this group where every member can see them. This cannot be undone from the UI.
                          </p>
                          <Button type="button" variant="outline" size="sm" className="mt-2" disabled={acting} onClick={onShareData}>
                            Share with group
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <form onSubmit={onCreateGroup} className="mt-5 flex gap-2 border-t border-border pt-4">
                <Input
                  placeholder="New group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  maxLength={100}
                  disabled={acting}
                />
                <Button type="submit" variant="default" size="sm" disabled={acting || !newGroupName.trim()}>
                  Create group
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Workspace members</h3>
                <Badge variant="secondary">{users.length}</Badge>
              </div>

              <div className="space-y-4">
                {users.map((member) => {
                  const isCurrentUser = member.id === currentUserId;
                  const initials = getInitials(member.name);
                  return (
                    <div key={member.email} className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={member.picture ?? ""} alt={member.name} />
                        <AvatarFallback className={getRoleAvatarClass(member.role)}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{member.name}</p>
                          {isCurrentUser && (
                            <Badge variant="default" className="text-xs">ADMIN</Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <select
                          value={member.role}
                          onChange={(event) => onRoleChange(member.id, event.target.value as UserRole)}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold capitalize outline-none transition-colors focus:border-primary"
                        >
                          {(['admin', 'broker', 'viewer'] as UserRole[]).map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Invite Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Team & Access</h3>
              <p className="text-sm text-muted-foreground">Manage members and invite people to your workspace.</p>

              <div className="mt-4 rounded-lg bg-accent/10 p-5">
                <p className="text-xs font-semibold text-primary">Share an invite link</p>
                <p className="mt-1 text-[11px] text-primary">Anyone with this link can request to join your workspace.</p>
                <div className="mt-3 flex gap-2">
                  <input readOnly value="join.maligroup.com/design-team" className="min-w-0 flex-1 rounded-lg border-0 bg-white/50 px-4 text-xs text-muted-foreground" />
                  <Button onClick={copyLink} size="sm" variant="ghost">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="8" height="8" x="8" y="8" rx="2" />
                      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                    </svg>
                    Copy link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password & Security */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Password & security</h3>
                  <p className="text-xs text-muted-foreground">Password last changed 3 months ago.</p>
                </div>
                {!editingPassword && (
                  <Button onClick={() => setEditingPassword(true)} variant="outline" size="sm">
                    Change password
                  </Button>
                )}
              </div>

              {editingPassword ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setEditingPassword(false);
                    notify("Password updated successfully");
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Current password</label>
                      <input type="password" placeholder="Enter current password" className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">New password</label>
                      <input type="password" placeholder="At least 8 characters" className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Confirm new password</label>
                      <input type="password" placeholder="Repeat new password" className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <Button type="button" onClick={() => setEditingPassword(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" size="sm">
                      Update password
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</p>
                    <p className="mt-1 text-sm text-foreground">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Two-step verification</p>
                    <p className="mt-1 text-sm text-muted-foreground">Not enabled</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Section */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Billing & Subscription</h3>
                  <p className="text-muted-foreground text-sm">
                    Manage your subscription and billing details
                  </p>
                </div>
                <Button variant="outline">
                  <Settings className="mr-2 size-4" />
                  Billing Settings
                </Button>
              </div>

              {/* Current Plan */}
              <Card className="mb-8 p-0">
                <CardContent className="p-6">
                  <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="text-primary size-5" />
                        <h2 className="text-lg font-semibold text-foreground">Pro Plan</h2>
                        <Badge>Current Plan</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        $29/month • Renews on April 1, 2024
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline">Change Plan</Button>
                      <Button variant="outline">Cancel Plan</Button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="text-primary size-4" />
                          <span className="text-sm font-medium text-foreground">API Requests</span>
                        </div>
                        <span className="text-sm text-foreground">8,543 / 10,000</span>
                      </div>
                      <Progress value={85.43} className="h-2" />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="text-primary size-4" />
                          <span className="text-sm font-medium text-foreground">Monthly Syncs</span>
                        </div>
                        <span className="text-sm text-foreground">143 / 200</span>
                      </div>
                      <Progress value={71.5} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="mb-8 p-0">
                <CardContent className="p-6">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">Payment Method</h3>
                      <div className="flex items-center gap-2">
                        <CreditCard className="text-muted-foreground size-4" />
                        <span className="text-muted-foreground text-sm">
                          Visa ending in 4242
                        </span>
                      </div>
                    </div>
                    <Button variant="outline">Update Payment Method</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card className="p-0">
                <CardContent className="p-6">
                  <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row">
                    <h3 className="text-lg font-semibold text-foreground">Billing History</h3>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 size-4" />
                      Download All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex flex-col items-start justify-between gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-muted rounded-md p-2">
                            <FileText className="text-muted-foreground size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{invoice.id}</p>
                            <p className="text-muted-foreground text-sm">
                              {invoice.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{invoice.status}</Badge>
                          <span className="font-medium text-foreground">{invoice.amount}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>

      {showInvite && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-primary/60 p-5 backdrop-blur-sm"
          onMouseDown={() => setShowInvite(false)}
        >
          <form
            onSubmit={sendInvite}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border-2 border-primary bg-background p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-11 place-items-center rounded-full bg-accent text-primary">
                <Mail className="size-5" />
              </div>
              <button type="button" onClick={() => setShowInvite(false)} className="text-muted-foreground">
                ×
              </button>
            </div>
            <h2 className="mt-5 font-serif text-3xl tracking-tight text-foreground">Invite a new member</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              They'll receive an email invitation to join the team.
            </p>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-semibold text-foreground">Email address</span>
              <input
                autoFocus
                required
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/50"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowInvite(false)} className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-foreground">Cancel</button>
              <button className="rounded-lg border-2 border-primary bg-accent px-5 py-2.5 text-xs font-semibold text-primary hover:bg-primary hover:text-accent">Send invitation</button>
            </div>
          </form>
        </div>
      )}

      {confirmAction && (
        <Dialog open onOpenChange={() => setConfirmAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmAction.title}</DialogTitle>
              <DialogDescription>{confirmAction.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={acting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={acting}
                onClick={async () => {
                  const fn = confirmAction.onConfirm;
                  setConfirmAction(null);
                  await fn();
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

function getRoleAvatarClass(role: UserRole): string {
  switch (role) {
    case 'admin':
      return "bg-accent/20 text-primary";
    case 'broker':
      return "bg-secondary/50 text-foreground";
    case 'viewer':
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary/50 text-foreground";
  }
}