'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  title: string
  message?: string
  type: ToastType
}

interface ToastContext {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContext | undefined>(undefined)

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'text-[oklch(0.70_0.18_155)]',
  error: 'text-destructive',
  warning: 'text-amber-600',
  info: 'text-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type]
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-lg',
                'min-w-[320px] max-w-[400px]',
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TOAST_COLORS[toast.type])} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                {toast.message && <p className="mt-1 text-xs text-muted-foreground">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="ml-2 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
