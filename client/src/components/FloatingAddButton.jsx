import { Link } from 'react-router-dom'
import './FloatingAddButton.css'

// Mobile-only (hidden ≥768px via CSS) — the thumb-reachable way to create a
// note on a phone, floating above the bottom nav.
export default function FloatingAddButton() {
  return (
    <Link to="/notes/new" className="fab" aria-label="Add a new note">
      +
    </Link>
  )
}
