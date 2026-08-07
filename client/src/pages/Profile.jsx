import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'
import { useNotesStore } from '../store/notesStore.js'
import './Profile.css'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const resetNotes = useNotesStore((s) => s.reset)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    resetNotes() // clear cached notes so the next user never sees a stale list
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile">
      <h1>Profile</h1>
      <div className="profile__card">
        <div className="profile__avatar" aria-hidden="true">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div className="profile__name">{user?.name}</div>
          <div className="profile__email">{user?.email}</div>
        </div>
      </div>
      <button className="profile__logout" onClick={handleLogout}>
        Log out
      </button>
    </div>
  )
}
