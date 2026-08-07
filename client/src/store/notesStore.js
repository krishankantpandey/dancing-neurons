import { create } from 'zustand'
import {
  listNotesRequest,
  createNoteRequest,
  updateNoteRequest,
  deleteNoteRequest,
} from '../api/notes.js'

// Central cache for the logged-in user's notes. Pages read from here instead
// of each fetching + storing their own copy, so creating/editing/deleting a
// note in one place (e.g. NoteEditor) is immediately reflected everywhere
// else (Dashboard, Categories) without a full refetch.
export const useNotesStore = create((set, get) => ({
  notes: [],
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  error: null,

  fetchNotes: async () => {
    set({ status: 'loading', error: null })
    try {
      const { notes } = await listNotesRequest()
      set({ notes, status: 'ready' })
    } catch (err) {
      set({ status: 'error', error: err.message })
    }
  },

  addNote: async (data) => {
    const { note } = await createNoteRequest(data)
    set({ notes: [note, ...get().notes] })
    return note
  },

  editNote: async (id, data) => {
    const { note } = await updateNoteRequest(id, data)
    set({ notes: get().notes.map((n) => (n._id === id ? note : n)) })
    return note
  },

  removeNote: async (id) => {
    await deleteNoteRequest(id)
    set({ notes: get().notes.filter((n) => n._id !== id) })
  },

  reset: () => set({ notes: [], status: 'idle', error: null }),
}))
