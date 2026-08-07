import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/notes/new', label: 'Add', icon: '➕' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

// Visible only below 768px (see BottomNav.css) — the primary navigation on
// mobile, replacing the desktop sidebar.
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
