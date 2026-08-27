'use client'

import { ShieldCheck, UserRound } from 'lucide-react'
import { type AuthUser, type UserRole } from '@/lib/data'

interface AdminAccessPanelProps {
  users: AuthUser[]
  currentUserId: string
  onRoleChange: (userId: string, role: UserRole) => void
}

const roles: UserRole[] = ['admin', 'broker', 'viewer']

export function AdminAccessPanel({ users, currentUserId, onRoleChange }: AdminAccessPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Role Access</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign access levels for the people who use this workspace.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workspace members</p>
        </div>
        <div className="divide-y divide-border">
          {users.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                {member.picture ? (
                  <img src={member.picture} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <UserRound className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              <label className="sr-only" htmlFor={`role-${member.id}`}>Role for {member.name}</label>
              <select
                id={`role-${member.id}`}
                value={member.role}
                onChange={(event) => onRoleChange(member.id, event.target.value as UserRole)}
                disabled={member.id === currentUserId}
                className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold capitalize text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Your own administrator access is protected. Role changes apply to this active workspace session.</p>
    </div>
  )
}

