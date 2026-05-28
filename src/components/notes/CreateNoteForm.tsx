'use client'
import { useState } from 'react'

interface Props {
  onSave: (title: string, content: string) => Promise<void>
  onCancel: () => void
}

export default function CreateNoteForm({ onSave, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  async function handleSave() {
    if (!title.trim()) return
    await onSave(title.trim(), content.trim())
    setTitle('')
    setContent('')
  }

  return (
    <div
      className="mb-4 max-w-2xl mx-auto w-full rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
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
        <button onClick={onCancel} className="text-white/50 hover:text-white text-sm transition-colors">
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
    </div>
  )
}