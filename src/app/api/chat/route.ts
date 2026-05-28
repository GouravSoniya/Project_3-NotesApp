import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CohereClient } from 'cohere-ai'
import Groq from 'groq-sdk'

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function classifyQuery(message: string): 'metadata' | 'content' {
  const lower = message.toLowerCase()
  const metadataKeywords = ['how many', 'count', 'total', 'oldest', 'newest', 'last note', 'first note']
  if (metadataKeywords.some(k => lower.includes(k))) return 'metadata'
  return 'content'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('usage')
    .select('ai_messages')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const plan = subscription?.plan || 'free'
  const limit = plan === 'pro' ? 20 : 5
  const currentUsage = usage?.ai_messages || 0

  // TODO: uncomment after Razorpay is set up
  if (currentUsage >= limit) {
    return NextResponse.json(
      { error: `Daily limit of ${limit} AI messages reached.` },
      { status: 429 }
    )
  }

  const { message } = await request.json()
  const intent = classifyQuery(message)
  let context = ''

  if (intent === 'metadata') {
    const { count } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    context = `The user has ${count} notes in total.`

  } else {
    // Embed the query
    const queryEmbedding = await cohere.embed({
      texts: [message],
      model: 'embed-english-v3.0',
      inputType: 'search_query'
    })
    const embedding = (queryEmbedding.embeddings as number[][])[0]

    // Find similar note IDs
    const { data: matches } = await supabase.rpc('match_embeddings', {
      query_embedding: embedding,
      match_user_id: user.id,
      match_count: 15  // bumped from 5
    })

    const noteIds = matches?.map((m: { note_id: string }) => m.note_id) || []

    // Fetch actual structured notes
    const { data: notes } = await supabase
      .from('notes')
      .select('title, content')
      .in('id', noteIds)

    context = notes?.map((n, i) =>
      `Note ${i + 1}:\nTitle: ${n.title}\nContent: ${n.content || 'No content'}`
    ).join('\n\n---\n\n') || 'No notes found.'
  }

  
  // Generate response
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',  // upgraded from 8b
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant. Answer the user's question based on their notes below. If the answer isn't in the notes, say so.\n\nNotes:\n${context}`
      },
      {
        role: 'user',
        content: message
      }
    ]
  })
  
  const reply = completion.choices[0].message.content
  
  // Update usage
  await supabase.from('usage').upsert({
    user_id: user.id,
    date: today,
    ai_messages: currentUsage + 1
  }, { onConflict: 'user_id,date' })
  
  return NextResponse.json({ reply })
}