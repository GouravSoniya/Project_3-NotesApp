'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotesStore } from '@/store/useNotesStore'

interface Props {
  user: {
    id: string
    email: string
  }
}

export default function NotesApp({ user }: Props) {
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

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setNotes(data)
    }

    fetchNotes()
  }, [])

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
    }
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">

    {/* Top Bar */}
    <header className="flex items-center justify-between mb-6">
    <h1 className="text-white text-3xl font-[family-name:var(--font-cormorant)] font-light tracking-wide">
        My Notes
    </h1>
    <div className="flex items-center gap-3">
        <button
        className="px-4 py-2 rounded-full text-white/80 hover:text-white text-sm transition-colors"
        style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
        }}
        onClick={() => setCreatingNote(true)}
        >
        + New Note
        </button>
        <div
        className="flex items-center gap-3 px-4 py-2 rounded-full"
        style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
        }}
        >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">
            {user.email[0].toUpperCase()}
        </div>
        <span className="text-white/80 text-sm">{user.email}</span>
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
                <h3 className="text-white font-[family-name:var(--font-cormorant)] text-xl font-medium">
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
              <p className={`text-white/60 text-sm ${expandedNote === note.id ? '' : 'line-clamp-1'}`}>
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
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all"
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
          className="fixed bottom-24 right-6 w-80 h-96 rounded-2xl flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div className="p-4 border-b border-white/10">
            <p className="text-white text-sm font-medium">AI Assistant</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {chatHistory.length === 0 && (
              <p className="text-white/40 text-sm">Ask anything about your notes...</p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-xl max-w-[90%] ${
                  msg.role === 'user'
                    ? 'bg-white/20 text-white self-end'
                    : 'bg-white/10 text-white/80 self-start'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white/10 text-white/50 text-sm px-3 py-2 rounded-xl self-start">
                Thinking...
              </div>
            )}
          </div>
          <div className="p-3 border-t border-white/10">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full px-3 py-2 rounded-xl text-white placeholder-white/30 outline-none text-sm"
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