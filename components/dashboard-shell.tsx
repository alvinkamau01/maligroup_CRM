'use client'

import { Building2, Home, FileText, MessageSquare, LogOut, Bell, Search, Shield, Moon, Sun, UserCog, UserRound, BriefcaseBusiness, Target } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { type AuthUser } from '@/lib/data'
import { cn } from '@/lib/utils'

export type ActiveView = 'overview' | 'seller-leads' | 'buyer-leads' | 'buy-box' | 'agreements' | 'communications' | 'admin-access'

interface DashboardShellProps {
  user: AuthUser
  activeView: ActiveView
  onViewChange: (v: ActiveView) => void
  onLogout: () => void
  children: React.ReactNode
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ElementType; description: string; roles: string[] }[] = [
  { id: 'overview', label: 'Overview', icon: Home, description: 'Dashboard summary', roles: ['admin', 'broker', 'viewer'] },
  { id: 'seller-leads', label: 'Seller Leads', icon: UserRound, description: 'Individual ownership records', roles: ['admin', 'broker'] },
  { id: 'buyer-leads', label: 'Buyer Leads', icon: BriefcaseBusiness, description: 'Company & trust portfolios', roles: ['admin', 'broker'] },
  { id: 'buy-box', label: 'Buy Box', icon: Target, description: 'Sourced matches & deal pipeline', roles: ['admin', 'broker'] },
  { id: 'agreements', label: 'PSA Manager', icon: FileText, description: 'Purchase & Sale Agreements', roles: ['admin', 'broker', 'viewer'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, description: 'Email / SMS outreach', roles: ['admin', 'broker'] },
  { id: 'admin-access', label: 'Role Access', icon: UserCog, description: 'Manage workspace roles', roles: ['admin'] },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-accent/20 text-accent border-accent/40',
  broker: 'bg-[oklch(0.70_0.18_155_/_20%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]',
  viewer: 'bg-muted text-muted-foreground border-border',
}

export function DashboardShell({ user, activeView, onViewChange, onLogout, children }: DashboardShellProps) {
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role))
  const { theme, toggleTheme } = useTheme()
  const current = visibleNav.find((n) => n.id === activeView)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-5 py-2 bg-card border-b border-border shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shrink-0">
            <Building2 className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground leading-tight truncate">Mali Group</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">Real Estate</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 pl-4 ml-2 border-l border-border">
          <h2 className="text-xs font-semibold text-foreground truncate">{current?.label ?? 'Dashboard'}</h2>
          <span className="text-muted-foreground/50 text-xs">/</span>
          <span className="text-xs text-muted-foreground truncate">{current?.description}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Auth status indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[oklch(0.70_0.18_155_/_12%)] border border-[oklch(0.70_0.18_155_/_25%)]">
            <Shield className="w-3 h-3 text-[oklch(0.70_0.18_155)]" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-[oklch(0.70_0.18_155)]">Authenticated</span>
          </div>

          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-coral" />
            <span className="sr-only">Notifications</span>
          </button>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            <span className="sr-only">Toggle color theme</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full shrink-0 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-accent">{user.name.charAt(0)}</span>
              </div>
            )}
            <div className="hidden lg:block min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              <span className={cn('text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border inline-block', ROLE_COLORS[user.role])}>
                {user.role}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-coral hover:bg-coral/10 transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Horizontal navigation */}
      <nav aria-label="Primary" className="flex items-center gap-1 px-5 bg-card border-b border-border shrink-0 overflow-x-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 px-4 py-4 border-b-[3px] whitespace-nowrap transition-colors',
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              <span className="text-[15px] font-semibold">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-5">{children}</main>
    </div>
  )
}
