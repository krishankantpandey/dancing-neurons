import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchNotesRequest } from '../api/notes.js'
import NoteCard from '../components/NoteCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import './SearchResults.css'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!query) return // no fetch to run — render checks `!query` directly below, no state needed

    let cancelled = false
    // Necessary (not just initial-mount) setState: `query` can change to a
    // new value while this component stays mounted (typing a new search
    // without navigating away), and status must flip back to loading then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading')
    searchNotesRequest(query)
      .then(({ results }) => {
        if (!cancelled) {
          setResults(results)
          setStatus('ready')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <div className="search-results">
      {query && <h1>Results for “{query}”</h1>}

      {!query && (
        <EmptyState
          icon="🔍"
          title="Search by meaning"
          message='Try something like "time travel movies" — Memory Vault matches on meaning, not just exact words.'
        />
      )}

      {status === 'loading' && <LoadingSpinner label="Searching…" />}
      {status === 'error' && <ErrorBanner message={error} />}

      {status === 'ready' && results.length === 0 && (
        <EmptyState icon="🕳️" title="No matches" message="Nothing in your vault is similar enough to that yet." />
      )}

      {status === 'ready' && results.length > 0 && (
        <div className="search-results__grid">
          {results.map((note) => (
            <NoteCard key={note._id} note={note} score={note.score} />
          ))}
        </div>
      )}
    </div>
  )
}
