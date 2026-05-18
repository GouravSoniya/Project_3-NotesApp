import { create } from 'zustand'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

interface NotesStore {
  notes: Note[]
  setNotes: (notes: Note[]) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => n.id === id ? { ...n, ...updates } : n)
  })),
  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id)
  })),
}))