import NoteCard from './NoteCard'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  embedding_status: 'pending' | 'success' | 'failed'
}

interface Props {
  notes: Note[]
  search: string
  onUpdate: (id: string, title: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function NotesList({ notes, search, onUpdate, onDelete }: Props) {
  const filtered = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    (note.content || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
      {filtered.map(note => (
        <NoteCard key={note.id} note={note} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  )
}