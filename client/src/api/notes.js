import { apiFetch } from './client.js'

export const CATEGORIES = [
  'Idea',
  'Thought',
  'Movie',
  'Book',
  'Quote',
  'Task',
  'Observation',
  'Learning',
]

export const listNotesRequest = (category) =>
  apiFetch(`/notes${category ? `?category=${encodeURIComponent(category)}` : ''}`)

export const getNoteRequest = (id) => apiFetch(`/notes/${id}`)

export const createNoteRequest = (note) => apiFetch('/notes', { method: 'POST', body: note })

export const updateNoteRequest = (id, note) => apiFetch(`/notes/${id}`, { method: 'PUT', body: note })

export const deleteNoteRequest = (id) => apiFetch(`/notes/${id}`, { method: 'DELETE' })

export const getRelatedNotesRequest = (id) => apiFetch(`/notes/${id}/related`)

export const getNoteSummaryRequest = (id) => apiFetch(`/notes/${id}/summary`, { method: 'POST' })

export const searchNotesRequest = (query) => apiFetch(`/search?q=${encodeURIComponent(query)}`)
