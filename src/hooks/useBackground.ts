'use client'

import { useState, useEffect } from 'react'

export function useBackground() {
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const device = isMobile ? 'mobile' : 'desktop'

    fetch(`/api/background?device=${device}`)
      .then(res => res.json())
      .then(data => {
        if (data.url) setBgUrl(data.url)
      })
      .catch(() => setBgUrl(null))
  }, [])

  return bgUrl
}