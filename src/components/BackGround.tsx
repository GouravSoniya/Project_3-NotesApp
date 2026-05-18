'use client'

import { useBackground } from '@/hooks/useBackground'

export default function Background({ children }: { children: React.ReactNode }) {
  const bgUrl = useBackground()

  const backgroundStyle = bgUrl
    ? {
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, #1a3a2a 0%, #0d2137 50%, #1a1a2e 100%)',
      }

  return (
    <div className="min-h-screen w-full relative" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}