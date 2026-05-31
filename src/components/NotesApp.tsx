'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotesStore } from '@/store/useNotesStore'
import Header from './notes/Header'
import SearchBar from './notes/SearchBar'
import CreateNoteForm from './notes/CreateNoteForm'
import NotesList from './notes/NotesList'
import AIChat from './chat/AIChat'

interface Props {
  user: { id: string; email: string }
  signOut: () => Promise<void>
}

export default function NotesApp({ user, signOut }: Props) {
  const [creatingNote, setCreatingNote] = useState(false)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState<'free' | 'pro'>('free')
  const { notes, setNotes, addNote, updateNote, deleteNote } = useNotesStore()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setPlan('pro')
      window.history.replaceState({}, '', '/')
    }
    async function fetchNotes() {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setNotes(data)

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .single()
      setPlan(subscription?.plan || 'free')
    }
    fetchNotes()
  }, [])

  useEffect(() => {
    const hasPending = notes.some(n => n.embedding_status === 'pending')
    if (!hasPending) return

    const interval = setInterval(async () => {
      const pendingIds = notes.filter(n => n.embedding_status === 'pending').map(n => n.id)
      const { data: updatedNotes } = await supabase
        .from('notes')
        .select('id, embedding_status')
        .in('id', pendingIds)
      if (updatedNotes) {
        updatedNotes.forEach(n => updateNote(n.id, { embedding_status: n.embedding_status }))
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [notes])

  async function handleCreateNote(title: string, content: string) {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: content || null })
    })
    const data = await response.json()
    if (response.status === 429) { alert(data.error); return }
    if (data.id) {
      addNote(data)
      setCreatingNote(false)
    }
  }

  async function handleUpdateNote(id: string, title: string, content: string) {
    const response = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, content: content || null })
    })
    const data = await response.json()
    if (data.id) updateNote(id, data)
  }

  async function handleDeleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    deleteNote(id)
  }

  async function handleUpgrade() {
    const response = await fetch('/api/stripe/checkout', { method: 'POST' })
    if (!response.ok) { alert('Something went wrong. Try again.'); return }
    const { url } = await response.json()
    window.location.href = url
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      <Header
        user={user}
        plan={plan}
        onNewNote={() => setCreatingNote(true)}
        onUpgrade={handleUpgrade}
        signOut={signOut}
      />
      <SearchBar value={search} onChange={setSearch} />
      {creatingNote && (
        <CreateNoteForm
          onSave={handleCreateNote}
          onCancel={() => setCreatingNote(false)}
        />
      )}
      <NotesList notes={notes} search={search} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />
      <AIChat />
    </div>
  )
}