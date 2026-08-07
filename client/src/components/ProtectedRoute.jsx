import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, selectIsAuthenticated } from '../store/authStore.js'

// Wraps a group of routes (via <Outlet/>) and bounces to /login if there's
// no JWT in the auth store. Sits around the whole authenticated section of
// the router — see App.jsx.
export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
