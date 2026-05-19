import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CohereClient } from 'cohere-ai'

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
})

async function generateAndStoreEmbedding(noteId: string, userId: string, title: string, content: string | null) {
  const embeddingContent = `${title}\n${content || ''}`
  try {
    const response = await cohere.embed({
      texts: [embeddingContent],
      model: 'embed-english-v3.0',
      inputType: 'search_document'
    })
    const embedding = (response.embeddings as number[][])[0]
    const supabase = await createClient()
    await supabase.from('embeddings').delete().eq('note_id', noteId)
    await supabase.from('embeddings').insert({
      note_id: noteId,
      user_id: userId,
      content: embeddingContent,
      embedding
    })
  } catch (err) {
    console.error('Embedding generation failed:', err)
  }
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
    .select('notes_created')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const plan = subscription?.plan || 'free'
  const limit = plan === 'pro' ? Infinity : 5
  const currentUsage = usage?.notes_created || 0

  // TODO: uncomment after Razorpay is set up
  // if (currentUsage >= limit) {
  //   return NextResponse.json(
  //     { error: 'Daily limit of 5 notes reached. Upgrade to Pro for unlimited notes.' },
  //     { status: 429 }
  //   )
  // }

  const { title, content } = await request.json()

  const { data: note, error } = await supabase
    .from('notes')
    .insert({ title, content, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('usage').upsert({
    user_id: user.id,
    date: today,
    notes_created: currentUsage + 1
  }, { onConflict: 'user_id,date' })

  generateAndStoreEmbedding(note.id, user.id, title, content)

  return NextResponse.json(note)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, title, content } = await request.json()

  const { data: note, error } = await supabase
    .from('notes')
    .update({
      title,
      content,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  generateAndStoreEmbedding(note.id, user.id, title, content)

  return NextResponse.json(note)
}