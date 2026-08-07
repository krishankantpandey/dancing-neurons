import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNotesStore } from '../store/notesStore.js'
import NoteCard from '../components/NoteCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import './Dashboard.css'

export default function Dashboard() {
  const { notes, status, error, fetchNotes } = useNotesStore()

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return (
    <div className="dashboard">
      <h1>Your Memory Vault</h1>

      {status === 'loading' && <LoadingSpinner label="Loading your notes…" />}
      {status === 'error' && <ErrorBanner message={error} />}

      {status === 'ready' && notes.length === 0 && (
        <EmptyState
          icon="🗒️"
          title="Nothing saved yet"
          message="Capture an idea, a favorite quote, or a movie you loved — you'll be able to find it later by meaning, not just keywords."
          action={<Link to="/notes/new" className="dashboard__cta">Add your first note</Link>}
        />
      )}

      {status === 'ready' && notes.length > 0 && (
        <div className="dashboard__grid">
          {notes.map((note) => (
            <NoteCard key={note._id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
