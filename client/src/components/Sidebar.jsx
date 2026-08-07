import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import './Sidebar.css'

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/notes/new', label: 'Add Note', icon: '➕' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

// Visible only at ≥768px (see Sidebar.css) — the desktop counterpart to
// BottomNav. Same routes, different chrome, because desktop users expect a
// persistent nav rail rather than a bottom bar.
export default function Sidebar() {
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">🧠 Memory Vault</div>
      <nav aria-label="Primary">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {user && <div className="sidebar__user">Signed in as {user.name}</div>}
    </aside>
  )
}
