import { NextResponse } from 'next/server'

const desktopTopics = ['green forest', 'icy mountains', 'tropical beach', 'misty forest', 'mountain lake']
const mobileTopics = ['minimal nature', 'vertical mountain', 'phone wallpaper nature', 'abstract gradient', 'foggy forest']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const device = searchParams.get('device') === 'mobile' ? 'mobile' : 'desktop'

    const topics = device === 'mobile' ? mobileTopics : desktopTopics
    const orientation = device === 'mobile' ? 'portrait' : 'landscape'
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(randomTopic)}&orientation=${orientation}`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    )

    if (!response.ok) throw new Error('Unsplash failed')

    const data = await response.json()

    // request an appropriately-sized version instead of always full-res
    const width = device === 'mobile' ? 1080 : 1920
    const url = `${data.urls.raw}&w=${width}&q=80&fit=max`

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}