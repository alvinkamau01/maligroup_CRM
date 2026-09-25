'use client'

import { Building2, Home, Users, FileText, MessageSquare, LogOut, ChevronRight, Bell, Search, Shield, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { type AuthUser } from '@/lib/data'
import { cn } from '@/lib/utils'

export type ActiveView = 'overview' | 'property-leads' | 'facebook-leads' | 'agreements' | 'communications'

interface DashboardShellProps {
  user: AuthUser
  activeView: ActiveView
  onViewChange: (v: ActiveView) => void
  onLogout: () => void
  children: React.ReactNode
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ElementType; description: string; roles: string[] }[] = [
  { id: 'overview', label: 'Overview', icon: Home, description: 'Dashboard summary', roles: ['admin', 'broker', 'viewer'] },
  { id: 'property-leads', label: 'Property Leads', icon: Building2, description: 'County & skip-trace records', roles: ['admin', 'broker'] },
  { id: 'facebook-leads', label: 'Facebook Leads', icon: Users, description: 'Social media intent signals', roles: ['admin', 'broker'] },
  { id: 'agreements', label: 'PSA Manager', icon: FileText, description: 'Purchase & Sale Agreements', roles: ['admin', 'broker', 'viewer'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, description: 'Email / SMS outreach', roles: ['admin', 'broker'] },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-primary/20 text-primary border-primary/30',
  broker: 'bg-[oklch(0.70_0.18_155_/_20%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]',
  viewer: 'bg-muted text-muted-foreground border-border',
}

export function DashboardShell({ user, activeView, onViewChange, onLogout, children }: DashboardShellProps) {
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role))
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/20 border border-primary/30 shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-sidebar-foreground leading-tight truncate">Leads Workflow</p>
            <p className="text-[10px] text-muted-foreground truncate">Operations Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Navigation
          </p>
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors group',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground')} />
                <span className="text-sm font-medium truncate">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto text-primary shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{user.name.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <span className={cn('text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border inline-block mt-0.5', ROLE_COLORS[user.role])}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-3 px-5 py-3 bg-sidebar border-b border-border shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {visibleNav.find((n) => n.id === activeView)?.label ?? 'Dashboard'}
              </h2>
              <span className="text-muted-foreground/50 text-xs">/</span>
              <span className="text-xs text-muted-foreground">
                {visibleNav.find((n) => n.id === activeView)?.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auth status indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[oklch(0.70_0.18_155_/_12%)] border border-[oklch(0.70_0.18_155_/_25%)]">
              <Shield className="w-3 h-3 text-[oklch(0.70_0.18_155)]" />
              <span className="text-[10px] font-semibold text-[oklch(0.70_0.18_155)]">Authenticated</span>
            </div>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
