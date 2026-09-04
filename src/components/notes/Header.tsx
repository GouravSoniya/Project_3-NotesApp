'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  user: { id: string; email: string }
  plan: 'free' | 'pro'
  onNewNote: () => void
  onUpgrade: () => void
  signOut: () => Promise<void>
}

export default function Header({ user, plan, onNewNote, onUpgrade, signOut }: Props) {
  const [showEmail, setShowEmail] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // close the tapped-open tooltip if user taps elsewhere
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowEmail(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-white text-2xl sm:text-3xl font-[family-name:var(--font-cormorant)] font-light tracking-wide">
          My Notes
        </h1>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium shrink-0"
          style={{
            background: plan === 'pro' ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.1)',
            border: plan === 'pro' ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.2)',
            color: plan === 'pro' ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.6)',
          }}
        >
          {plan === 'pro' ? '✦ Pro' : 'Free'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors whitespace-nowrap"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={onNewNote}
        >
          + New Note
        </button>

        {plan === 'free' && (
          <button
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors whitespace-nowrap"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={onUpgrade}
          >
            ✦ Upgrade
          </button>
        )}

        <div
          ref={wrapperRef}
          className="relative flex justify-between items-center px-3 py-4 w-30 h-10 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <button
            type="button"
            onClick={() => setShowEmail((v) => !v)}
            className="group w-6 h-6 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-white text-xs relative"
          >
            {user.email[0].toUpperCase()}

            {/* tooltip: shows on hover (desktop) or when showEmail is toggled (tap) */}
            <span
              className={`pointer-events-none absolute top-full right-0 mt-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-white/90 transition-opacity duration-150 ${
                showEmail ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{
                background: 'rgba(20,20,20,0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {user.email}
            </span>
          </button>

          <form action={signOut}>
            <button type="submit" className="text-white/50 hover:text-white text-xs transition-colors whitespace-nowrap">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}