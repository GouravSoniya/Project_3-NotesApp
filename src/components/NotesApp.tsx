'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotesStore } from '@/store/useNotesStore'

interface Props {
  user: {
    id: string
    email: string
  }

  signOut: () => Promise<void>
}

export default function NotesApp({ user, signOut }: Props) {
  const [aiOpen, setAiOpen] = useState(false)
  const [creatingNote, setCreatingNote] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [search, setSearch] = useState('')
  const { notes, setNotes, addNote, updateNote, deleteNote } = useNotesStore()
  const supabase = createClient()
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [plan, setPlan] = useState<'free' | 'pro'>('free')

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setNotes(data)

      // Fetch plan
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
      const pendingIds = notes
        .filter(n => n.embedding_status === 'pending')
        .map(n => n.id)

      const { data: updatedNotes } = await supabase
        .from('notes')
        .select('id, embedding_status')
        .in('id', pendingIds)

      if (updatedNotes) {
        updatedNotes.forEach(n => {
          updateNote(n.id, { embedding_status: n.embedding_status })
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [notes])

  async function handleCreateNote() {
    if (!title.trim()) return

    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), content: content.trim() || null })
    })

    const data = await response.json()

    if (response.status === 429) {
      alert(data.error)
      return
    }

    if (data.id) {
      addNote(data)
      setTitle('')
      setContent('')
      setCreatingNote(false)
    }
  }

  async function handleUpdateNote() {
    if (!editingNote || !editTitle.trim()) return

    const response = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingNote,
        title: editTitle.trim(),
        content: editContent.trim() || null
      })
    })

    const data = await response.json()

    if (data.id) {
      updateNote(editingNote, data)
      setEditingNote(null)
    }
  }

  async function handleDeleteNote(id: string) {
    await supabase.from('notes').delete().eq('id', id)
    deleteNote(id)
  }

  async function handleSendMessage() {
    if (!chatMessage.trim() || chatLoading) return

    const userMessage = chatMessage.trim()
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }])
    setChatMessage('')
    setChatLoading(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    })

    const data = await response.json()
    setChatLoading(false)

    if (data.reply) {
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }])
    } else if (data.error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: data.error }])
    }
  }

  async function handleUpgrade() {
    // Step 1 - create order on your backend
    const response = await fetch('/api/razorpay/order', { method: 'POST' })
    if (!response.ok) {
      alert('Something went wrong. Try again.')
      return
    }
    const { orderId, amount } = await response.json()

    // Step 2 - open Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency: 'INR',
      order_id: orderId,
      name: 'Notes App',
      description: 'Pro Plan - ₹199/month',
      handler: function () {
        alert('Payment successful! You are now Pro.')
      },
    }

    // @ts-ignore - Razorpay is loaded via script tag, TypeScript doesn't know about it
    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">

      {/* Top Bar */}
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
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            onClick={() => setCreatingNote(true)}
          >
            + New Note
          </button>
          {plan === 'free' && (
            <button
              className="px-5 py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
              onClick={handleUpgrade}
            >
              ✦ Upgrade to Pro
            </button>
          )}
          {process.env.NODE_ENV === 'development' && (
            <button
              className="px-5 py-2.5 rounded-full text-white/80 hover:text-white text-sm transition-colors"
              style={{
                background: 'rgba(255,165,0,0.2)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,165,0,0.4)',
              }}
              onClick={async () => {
                await fetch('/api/dev/upgrade', { method: 'POST' })
                setPlan('pro')
              }}
            >
              [DEV] Upgrade
            </button>
          )}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
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

      {/* Search Bar */}
      <div className="mb-6 max-w-2xl mx-auto w-full">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl text-white placeholder-white/40 outline-none text-sm"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />
      </div>

      {/* Create Note Form */}
      {creatingNote && (
        <div
          className="mb-4 max-w-2xl mx-auto w-full rounded-2xl p-5 flex flex-col gap-3"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-white placeholder-white/40 outline-none font-[family-name:var(--font-cormorant)] text-xl"
          />
          <textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full bg-transparent text-white/80 placeholder-white/40 outline-none text-sm resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCreatingNote(false)}
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              className="px-4 py-1.5 rounded-full text-white text-sm transition-colors"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
              onClick={handleCreateNote}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {notes
          .filter((note) =>
            note.title.toLowerCase().includes(search.toLowerCase())
          ).map((note) => (
            <div
              key={note.id}
              className="rounded-2xl px-5 py-4 flex flex-col gap-2 transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {editingNote === note.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-transparent text-white outline-none font-[family-name:var(--font-cormorant)] text-xl"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent text-white/80 outline-none text-sm resize-none"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingNote(null)}
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateNote}
                      className="px-4 py-1.5 rounded-full text-white text-sm"
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  >
                    <h3 className="text-white font-[family-name:var(--font-cormorant)] text-2xl font-medium">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingNote(note.id)
                          setEditTitle(note.title)
                          setEditContent(note.content || '')
                        }}
                        className="text-white/50 hover:text-white text-xs transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="text-white/50 hover:text-red-400 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {note.embedding_status === 'pending' && (
                    <p className="text-yellow-300/60 text-xs">Indexing for AI search...</p>
                  )}
                  {note.embedding_status === 'failed' && (
                    <p className="text-red-400/60 text-xs">AI search unavailable for this note</p>
                  )}
                  <p className={`text-white/60 text-base ${expandedNote === note.id ? '' : 'line-clamp-1'}`}>
                    {note.content}
                  </p>
                </>
              )}
            </div>
          ))}
      </div>

      {/* AI Chat Toggle */}
      <button
        onClick={() => setAiOpen(!aiOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center text-white text-xl transition-all"
        style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        {aiOpen ? '✕' : '✦'}
      </button>

      {/* AI Chat Window */}
      {aiOpen && (
        <div
          className="fixed bottom-28 right-8 w-96 h-[500px] rounded-2xl flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div className="p-5 border-b border-white/10">
            <p className="text-white text-base font-medium">AI Assistant</p>
          </div>
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
            {chatHistory.length === 0 && (
              <p className="text-white/40 text-sm">Ask anything about your notes...</p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-4 py-3 rounded-xl max-w-[90%] ${msg.role === 'user'
                    ? 'bg-white/20 text-white self-end'
                    : 'bg-white/10 text-white/80 self-start'
                  }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white/10 text-white/50 text-sm px-4 py-3 rounded-xl self-start">
                Thinking...
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/10">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none text-sm"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}