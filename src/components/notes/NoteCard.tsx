'use client'
import { useState } from 'react'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  embedding_status: 'pending' | 'success' | 'failed'
}

interface Props {
  note: Note
  onUpdate: (id: string, title: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function NoteCard({ note, onUpdate, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content || '')

  async function handleSave() {
    if (!editTitle.trim()) return
    await onUpdate(note.id, editTitle.trim(), editContent.trim())
    setIsEditing(false)
  }

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col gap-2 transition-all"
      style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
    >
      {isEditing ? (
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
            <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-full text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <h3 className="text-white font-[family-name:var(--font-cormorant)] text-2xl font-medium">
              {note.title}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={(e) => { e.stopPropagation(); setEditTitle(note.title); setEditContent(note.content || ''); setIsEditing(true) }}
                className="text-white/50 hover:text-white text-xs transition-colors"
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
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
          <p className={`text-white/60 text-base ${isExpanded ? '' : 'line-clamp-1'}`}>
            {note.content}
          </p>
        </>
      )}
    </div>
  )
}