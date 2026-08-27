'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type AuthUser } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'

interface AuthGateProps {
  onAuthenticated: (user: AuthUser) => void
}

function authMessage(error: { message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('email not confirmed')) return 'Check your email to confirm your account before signing in.'
  if (error.status === 429 || message.includes('rate limit')) return 'Too many attempts. Please wait and try again.'
  if (message.includes('password') && message.includes('6')) return 'Your password must be at least 6 characters.'
  if (message.includes('invalid login credentials') || message.includes('user not found')) return 'Invalid email or password.'
  return 'Authentication is temporarily unavailable. Please try again.'
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let active = true
    const loadUser = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!active || authError || !user) return
      const { data: profile } = await supabase.from('profiles').select('id,email,full_name,avatar_url,role').eq('id', user.id).maybeSingle()
      if (!active) return
      onAuthenticated({
        id: user.id,
        name: profile?.full_name || user.user_metadata?.full_name || user.email || 'Workspace member',
        email: profile?.email || user.email || '',
        role: profile?.role || 'viewer',
        token: user.id,
        picture: profile?.avatar_url || user.user_metadata?.avatar_url,
      })
    }
    void loadUser()
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadUser() })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [onAuthenticated, supabase])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo, data: { full_name: fullName } } })
    if (result.error) setError(authMessage(result.error))
    else if (mode === 'sign-up' && !result.data.session) setNotice('Account created. Check your email to confirm your account, then sign in.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary border-2 border-primary"><Building2 className="w-5 h-5 text-accent" aria-hidden="true" /></div>
          <div><h1 className="text-base font-bold text-foreground leading-tight">Mali Group</h1><p className="text-xs uppercase tracking-widest text-muted-foreground">Leads Operations</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div><h2 className="text-lg font-semibold text-foreground">{mode === 'sign-in' ? 'Sign in to continue' : 'Create your account'}</h2><p className="text-sm text-muted-foreground mt-1">Use your Supabase account to access the workspace.</p></div>
          {error && <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
          {notice && <div className="px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/25 text-primary text-sm">{notice}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'sign-up' && <div className="space-y-1.5"><label htmlFor="full-name" className="text-sm font-medium">Full name</label><input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></div>}
            <div className="space-y-1.5"><label htmlFor="email" className="text-sm font-medium">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></div>
            <div className="space-y-1.5"><label htmlFor="password" className="text-sm font-medium">Password</label><input id="password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></div>
            <Button type="submit" disabled={loading} className="w-full">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{mode === 'sign-in' ? 'Sign in' : 'Create account'}</Button>
          </form>
          <button type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setNotice('') }} className="w-full text-sm text-primary hover:underline">{mode === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button>
        </div>
      </div>
    </main>
  )
}
