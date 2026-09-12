'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Path = 'wholesale' | 'mortgage-rescue' | null

export default function LandingPage({ onSelect }: { onSelect: (path: Path) => void }) {
  const [hovered, setHovered] = useState<Path>(null)
  const [selected, setSelected] = useState<Path>(null)

  if (selected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-primary">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8 bg-accent/10 border border-accent/40">
            <ChevronRight className="h-7 w-7 text-accent" />
          </div>
          <p className="text-sm font-semibold tracking-widest uppercase mb-4 text-accent">
            {selected === 'wholesale' ? 'Wholesale' : 'Mortgage Rescue'}
          </p>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl leading-[1.15] tracking-tight text-primary-foreground mb-5">
            {selected === 'wholesale' ? 'Welcome to Wholesale' : "We're here to help you"}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground mb-10 max-w-md mx-auto">
            {selected === 'wholesale'
              ? 'Access competitive rates, fast underwriting, and a dedicated team to grow your book of business.'
              : 'Our specialists review your situation and explore every option to protect your home.'}
          </p>
          <Button variant="ghost" size="lg" onClick={() => setSelected(null)} className="text-base font-medium tracking-wide">
            ← Go back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Image
            src="/images/mg-logo.png"
            alt="Mali Group"
            width={72}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
        <a href="#" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-150">
          Need help?
        </a>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 lg:py-24">
        {/* Hero grid background */}
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: `
            linear-gradient(oklch(0.72 0.14 195 / 0.12) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.72 0.14 195 / 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} aria-hidden="true" />

        <div className="relative z-10 w-full max-w-4xl text-center">
          {/* Pill eyebrow */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-accent bg-accent/10 border border-accent/40 mb-6">
            Nationwide Direct Property Buyer
          </span>

          {/* Hero H1 */}
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground mb-4 text-balance">
            How can we help you today?
          </h1>

          {/* Lead paragraph */}
          <p className="text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto mb-12 text-pretty">
            Choose the service that fits your needs. We'll connect you with the right team.
          </p>

          {/* Choice cards */}
          <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
            {/* Wholesale card */}
            <button
              onClick={() => { setSelected('wholesale'); onSelect('wholesale') }}
              onMouseEnter={() => setHovered('wholesale')}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'relative text-left rounded-2xl p-8 transition-all duration-300',
                'border-2',
                hovered === 'wholesale'
                  ? 'bg-primary border-accent shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,193,214,0.1)_inset]'
                  : 'bg-card border-border hover:border-accent/50 hover:shadow-lg',
                'group'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300',
                hovered === 'wholesale'
                  ? 'bg-accent/10 border border-accent/40'
                  : 'bg-secondary border border-border'
              )}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke={hovered === 'wholesale' ? 'oklch(0.72 0.14 195)' : 'oklch(0.48 0.03 220)'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-colors duration-300"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>

              <div className={cn(
                'text-xs font-semibold tracking-widest uppercase mb-2 transition-colors duration-300',
                hovered === 'wholesale' ? 'text-accent' : 'text-muted-foreground'
              )}>
                For Brokers
              </div>

              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground mb-3 leading-tight">
                Wholesale
              </h2>

              <p className="text-base leading-relaxed text-muted-foreground mb-8">
                Access competitive wholesale lending rates, fast underwriting, and a dedicated account team to grow your book of business.
              </p>

              <div className="flex items-center gap-2 text-sm font-semibold transition-colors duration-300" style={{ color: hovered === 'wholesale' ? 'oklch(0.72 0.14 195)' : 'oklch(0.48 0.03 220)' }}>
                Get started
                <ChevronRight className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-300',
                  hovered === 'wholesale' ? 'translate-x-1' : 'translate-x-0'
                )} />
              </div>
            </button>

            {/* Mortgage Rescue card */}
            <button
              onClick={() => { setSelected('mortgage-rescue'); onSelect('mortgage-rescue') }}
              onMouseEnter={() => setHovered('mortgage-rescue')}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                'relative text-left rounded-2xl p-8 transition-all duration-300',
                'border-2',
                hovered === 'mortgage-rescue'
                  ? 'bg-primary border-accent shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,193,214,0.1)_inset]'
                  : 'bg-card border-border hover:border-accent/50 hover:shadow-lg',
                'group'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300',
                hovered === 'mortgage-rescue'
                  ? 'bg-accent/10 border border-accent/40'
                  : 'bg-secondary border border-border'
              )}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke={hovered === 'mortgage-rescue' ? 'oklch(0.72 0.14 195)' : 'oklch(0.48 0.03 220)'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-colors duration-300"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>

              <div className={cn(
                'text-xs font-semibold tracking-widest uppercase mb-2 transition-colors duration-300',
                hovered === 'mortgage-rescue' ? 'text-accent' : 'text-muted-foreground'
              )}>
                For Homeowners
              </div>

              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground mb-3 leading-tight">
                Mortgage Rescue
              </h2>

              <p className="text-base leading-relaxed text-muted-foreground mb-8">
                Facing financial hardship or the risk of foreclosure? Our specialists will work with you to find a solution and protect your home.
              </p>

              <div className="flex items-center gap-2 text-sm font-semibold transition-colors duration-300" style={{ color: hovered === 'mortgage-rescue' ? 'oklch(0.72 0.14 195)' : 'oklch(0.48 0.03 220)' }}>
                Get help now
                <ChevronRight className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-300',
                  hovered === 'mortgage-rescue' ? 'translate-x-1' : 'translate-x-0'
                )} />
              </div>
            </button>
          </div>

          {/* Trust strip */}
          <p className="text-xs text-muted-foreground/50 mt-16 tracking-widest uppercase">
            Licensed nationwide · Mali Group is a direct property buyer, not a broker
          </p>
        </div>
      </main>
    </div>
  )
}