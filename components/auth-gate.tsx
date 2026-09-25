'use client'

import { useState } from 'react'
import { Lock, Building2, AlertCircle } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { SignInButton } from '@clerk/nextjs'
import { jwtDecode } from 'jwt-decode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MOCK_USERS, type AuthUser } from '@/lib/data'

interface AuthGateProps {
  onAuthenticated: (user: AuthUser) => void
}

interface GoogleCredentialResponse {
  credential: string
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true)
        setError('')
        
        // Decode the JWT to get user info
        const decoded = jwtDecode<{
          email: string
          name: string
          picture: string
          email_verified: boolean
        }>(codeResponse.access_token)

        // Create a virtual AuthUser from Google data
        const googleUser: AuthUser = {
          id: `google_${decoded.email}`,
          name: decoded.name,
          email: decoded.email,
          role: 'viewer', // Default role for Google OAuth users
          token: codeResponse.access_token,
          picture: decoded.picture,
        }

        onAuthenticated(googleUser)
      } catch (err) {
        setError('Failed to authenticate with Google. Please try again.')
        console.error('[v0] Google OAuth error:', err)
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google authentication failed. Please try again.')
    },
    flow: 'implicit',
  })

  function handleLogin() {
    setLoading(true)
    setError('')
    setTimeout(() => {
      const user = MOCK_USERS.find((u) => u.token === token.trim())
      if (user) {
        onAuthenticated(user)
      } else {
        setError('Authentication required. Please provide a valid session token or API key.')
      }
      setLoading(false)
    }, 600)
  }

  function handleDemoLogin(demoToken: string) {
    setToken(demoToken)
    setLoading(true)
    setError('')
    setTimeout(() => {
      const user = MOCK_USERS.find((u) => u.token === demoToken)
      if (user) onAuthenticated(user)
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 border border-primary/30">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">Leads Workflow Dashboard</h1>
            <p className="text-xs text-muted-foreground">Real Estate Operations Platform</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Secure Access</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your session token or API key to continue.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>401 — {error}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Authorization Bearer Token
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="tok_..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleLogin()
                  }}
                  className="pl-9 font-mono text-sm bg-secondary/50 border-border"
                />
              </div>
              <Button onClick={handleLogin} disabled={loading || !token.trim()} className="shrink-0">
                {loading ? 'Verifying...' : 'Sign In'}
              </Button>
            </div>
          </div>

          {/* Clerk authentication */}
          <div className="pt-2 border-t border-border">
            <SignInButton mode="modal">
              <Button
                type="button"
                disabled={loading}
                variant="outline"
                className="w-full justify-center gap-2.5 bg-primary/10 hover:bg-primary/15 border-primary/30 hover:border-primary/50"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
                  C
                </span>
                Sign in with Clerk
              </Button>
            </SignInButton>
          </div>

          {/* Google OAuth */}
          <div className="pt-2 border-t border-border">
            <Button
              onClick={() => googleLogin()}
              disabled={loading}
              variant="outline"
              className="w-full justify-center gap-2.5 bg-secondary/30 hover:bg-secondary/50 border-border/60 hover:border-primary/40"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </div>

          {/* Demo access shortcuts */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2.5 font-medium">Demo Access — click to sign in:</p>
            <div className="flex flex-col gap-1.5">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleDemoLogin(u.token)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 border border-border/60 hover:border-primary/40 transition-colors group text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{u.email}</span>
                  </div>
                  <RoleBadge role={u.role} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Unauthorized access attempts are logged and reported.
        </p>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: 'bg-primary/20 text-primary border-primary/30',
    broker: 'bg-[oklch(0.70_0.18_155_/_20%)] text-[oklch(0.70_0.18_155)] border-[oklch(0.70_0.18_155_/_30%)]',
    viewer: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[role]}`}>
      {role}
    </span>
  )
}
