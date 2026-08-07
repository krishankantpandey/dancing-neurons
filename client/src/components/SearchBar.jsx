import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import './SearchBar.css'

// Lives in the top bar on every authenticated page. Submitting navigates to
// /search?q=... — SearchResults.jsx reads the query from the URL, so the
// search is shareable/bookmarkable and survives a refresh.
export default function SearchBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <span className="search-bar__icon" aria-hidden="true">🔍</span>
      <input
        type="search"
        placeholder="Search by meaning… e.g. time travel movies"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search your notes"
      />
    </form>
  )
}
