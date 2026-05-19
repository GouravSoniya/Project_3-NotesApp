import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CohereClient } from 'cohere-ai'
import Groq from 'groq-sdk'

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check AI message limit
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
  // if (currentUsage >= limit) {
  //   return NextResponse.json(
  //     { error: `Daily limit of ${limit} AI messages reached.` },
  //     { status: 429 }
  //   )
  // }

  const { message } = await request.json()

  // Embed the query
  const queryEmbedding = await cohere.embed({
    texts: [message],
    model: 'embed-english-v3.0',
    inputType: 'search_query'
  })
  const embedding = (queryEmbedding.embeddings as number[][])[0]

  // Find similar notes
  const { data: matches } = await supabase.rpc('match_embeddings', {
    query_embedding: embedding,
    match_user_id: user.id,
    match_count: 5
  })

  const context = matches?.map((m: { content: string }) => m.content).join('\n\n') || 'No notes found.'

  // Update usage
  await supabase.from('usage').upsert({
    user_id: user.id,
    date: today,
    ai_messages: currentUsage + 1
  }, { onConflict: 'user_id,date' })

  // Generate response
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
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

  return NextResponse.json({ reply })
}