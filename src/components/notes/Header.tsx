'use client'

interface Props {
  user: { id: string; email: string }
  plan: 'free' | 'pro'
  onNewNote: () => void
  onUpgrade: () => void
  signOut: () => Promise<void>
}

export default function Header({ user, plan, onNewNote, onUpgrade, signOut }: Props) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <h1 className="text-white text-5xl font-[family-name:var(--font-cormorant)] font-light tracking-wide">
          My Notes
        </h1>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: plan === 'pro' ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.1)',
            border: plan === 'pro' ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.2)',
            color: plan === 'pro' ? 'rgba(255,215,0,0.9)' : 'rgba(255,255,255,0.6)',
          }}
        >
          {plan === 'pro' ? '✦ Pro' : 'Free'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="px-5 py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
          onClick={onNewNote}
        >
          + New Note
        </button>
        {plan === 'free' && (
          <button
            className="px-5 py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={onUpgrade}
          >
            ✦ Upgrade to Pro
          </button>
        )}
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
            {user.email[0].toUpperCase()}
          </div>
          <span className="text-white/80 text-sm">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="text-white/50 hover:text-white text-xs transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}