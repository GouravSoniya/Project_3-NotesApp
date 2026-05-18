import { NextResponse } from 'next/server'

export async function GET() {
  try {
  const topics = ['green forest', 'icy mountains', 'tropical beach', 'misty forest', 'mountain lake']
  const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    
  const response = await fetch(
  `https://api.unsplash.com/photos/random?query=${encodeURIComponent(randomTopic)}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    )

    if (!response.ok) throw new Error('Unsplash failed')

    const data = await response.json()
    return NextResponse.json({ url: data.urls.full})
  } catch {
    return NextResponse.json({ url: null })
  }
}