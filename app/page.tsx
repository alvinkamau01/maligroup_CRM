'use client'

import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { AuthGate } from '@/components/auth-gate'
import { DashboardShell, type ActiveView } from '@/components/dashboard-shell'
import { OverviewPanel } from '@/components/overview-panel'
import { PropertyLeadsPanel } from '@/components/property-leads-panel'
import { FacebookLeadsPanel } from '@/components/facebook-leads-panel'
import { PSAManagerPanel } from '@/components/psa-manager-panel'
import { CommunicationsPanel } from '@/components/communications-panel'
import { type AuthUser, type UserRole } from '@/lib/data'

const VALID_ROLES: UserRole[] = ['admin', 'broker', 'viewer']

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const [authSource, setAuthSource] = useState<'clerk' | 'legacy' | null>(null)
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const { signOut } = useClerk()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser || user) return

    const metadataRole = clerkUser.publicMetadata.role
    const role = VALID_ROLES.includes(metadataRole as UserRole)
      ? (metadataRole as UserRole)
      : 'broker'

    setUser({
      id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress || 'Clerk user',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      role,
      token: `clerk:${clerkUser.id}`,
      picture: clerkUser.imageUrl,
    })
    setAuthSource('clerk')
  }, [clerkUser, isLoaded, isSignedIn, user])

  if (!user) {
    return <AuthGate onAuthenticated={(u) => {
      setAuthSource('legacy')
      setUser(u)
    }} />
  }

  function handleViewChange(view: ActiveView) {
    // Role-based access control
    const protectedViews: ActiveView[] = ['property-leads', 'facebook-leads', 'communications']
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
        if (authSource === 'clerk') {
          await signOut()
        }
        setAuthSource(null)
        setUser(null)
        setActiveView('overview')
      }}
    >
      {activeView === 'overview' && (
        <OverviewPanel user={user} onNavigate={handleViewChange} />
      )}
      {activeView === 'property-leads' && user.role !== 'viewer' && (
        <PropertyLeadsPanel />
      )}
      {activeView === 'facebook-leads' && user.role !== 'viewer' && (
        <FacebookLeadsPanel />
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
