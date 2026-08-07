import { useEffect } from 'react'
import { useNotesStore } from '../store/notesStore.js'
import { CATEGORIES } from '../api/notes.js'
import NoteCard from '../components/NoteCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import './Categories.css'

export default function Categories() {
  const { notes, status, error, fetchNotes } = useNotesStore()

  useEffect(() => {
    if (status === 'idle') fetchNotes()
  }, [status, fetchNotes])

  const grouped = CATEGORIES.map((category) => ({
    category,
    notes: notes.filter((n) => n.category === category),
  })).filter((group) => group.notes.length > 0)

  return (
    <div className="categories">
      <h1>Browse by category</h1>

      {status === 'loading' && <LoadingSpinner label="Loading your notes…" />}
      {status === 'error' && <ErrorBanner message={error} />}

      {status === 'ready' && grouped.length === 0 && (
        <EmptyState icon="🗂️" title="No categories yet" message="Add a few notes and they'll show up grouped here." />
      )}

      {status === 'ready' &&
        grouped.map(({ category, notes }) => (
          <section key={category} className="categories__section">
            <h2>{category} <span className="categories__count">({notes.length})</span></h2>
            <div className="categories__grid">
              {notes.map((note) => (
                <NoteCard key={note._id} note={note} />
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
