'use client'

import { useEffect, useState } from 'react'
import { AuthGate } from '@/components/auth-gate'
import { AdminAccessPanel } from '@/components/admin-access-panel'
import { DashboardShell, type ActiveView } from '@/components/dashboard-shell'
import { OverviewPanel } from '@/components/overview-panel'
import { UnifiedLeadsPanel } from '@/components/unified-leads-panel'
import { BuyBoxPanel } from '@/components/buy-box-panel'
import { PSAManagerPanel } from '@/components/psa-manager-panel'
import { CommunicationsPanel } from '@/components/communications-panel'
import { MOCK_USERS, type AuthUser, type UserRole } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [workspaceUsers, setWorkspaceUsers] = useState<AuthUser[]>(MOCK_USERS)
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const supabase = createClient()

  useEffect(() => {
    if (!user || user.id.startsWith('usr_')) return
    let active = true
    supabase.from('profiles').select('id,email,full_name,avatar_url,role').order('created_at').then((result: any) => {
      const data = result.data as Array<{ id: string; email: string | null; full_name: string | null; avatar_url: string | null; role: UserRole }>
      if (!active || !data.length) return
      setWorkspaceUsers(data.map((profile) => ({
        id: profile.id,
        name: profile.full_name || profile.email || 'Workspace member',
        email: profile.email || '',
        role: profile.role as UserRole,
        token: profile.id,
        picture: profile.avatar_url || undefined,
      })))
    })
    return () => { active = false }
  }, [supabase, user])

  if (!user) {
    return <AuthGate onAuthenticated={setUser} />
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    const currentUser = user
    if (!currentUser || currentUser.id.startsWith('usr_')) return
    const { data, error } = await supabase.rpc('set_profile_role', { target_user_id: userId, next_role: role })
    if (error || !data) return
    setWorkspaceUsers((members) => members.map((member) => member.id === userId ? { ...member, role } : member))
  }

  function handleViewChange(view: ActiveView) {
    // Role-based access control
    const protectedViews: ActiveView[] = ['seller-leads', 'buyer-leads', 'buy-box', 'communications']
    if (user && user.role === 'viewer' && protectedViews.includes(view)) {
      // Silently block — nav items are already hidden for viewers
      return
    }
    setActiveView(view)
  }

  return (
    <DashboardShell
      user={user}
      activeView={activeView}
      onViewChange={handleViewChange}
      onLogout={async () => {
        if (!user.id.startsWith('usr_')) await supabase.auth.signOut()
        setUser(null)
        setActiveView('overview')
      }}
    >
      {activeView === 'overview' && (
        <OverviewPanel user={user} onNavigate={handleViewChange} />
      )}
      {activeView === 'admin-access' && user.role === 'admin' && (
        <AdminAccessPanel users={workspaceUsers} currentUserId={user.id} onRoleChange={handleRoleChange} />
      )}
      {activeView === 'seller-leads' && user.role !== 'viewer' && (
        <UnifiedLeadsPanel kind="seller" user={user} />
      )}
      {activeView === 'buyer-leads' && user.role !== 'viewer' && (
        <UnifiedLeadsPanel kind="buyer" user={user} />
      )}
      {activeView === 'buy-box' && user.role !== 'viewer' && (
        <BuyBoxPanel />
      )}
      {activeView === 'agreements' && (
        <PSAManagerPanel />
      )}
      {activeView === 'communications' && user.role !== 'viewer' && (
        <CommunicationsPanel userRole={user.role} />
      )}
    </DashboardShell>
  )
}
