'use client'

import { useState, useEffect } from 'react'

export function useBackground() {
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/background')
      .then(res => res.json())
      .then(data => {
        if (data.url) setBgUrl(data.url)
      })
      .catch(() => setBgUrl(null))
  }, [])

  return bgUrl
}