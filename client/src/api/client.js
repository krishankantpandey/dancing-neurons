import { useAuthStore } from '../store/authStore.js'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Thin fetch wrapper shared by every API call: builds the full URL, attaches
// the JWT (if we have one), and turns a non-2xx response into a thrown Error
// with the server's message — so callers can just `try { await apiFetch(...) }`.
export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const token = useAuthStore.getState().token

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401) {
      // Token expired/invalid — drop it so ProtectedRoute redirects to
      // /login instead of the app looping on failed requests.
      useAuthStore.getState().logout()
    }
    throw new Error(data.message || `Request failed with status ${res.status}`)
  }

  return data
}
