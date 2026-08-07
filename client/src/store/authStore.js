import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// A small global store instead of Context: no provider wrapping needed, and
// `persist` transparently mirrors token+user to localStorage so a page
// refresh doesn't log the user out.
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'memory-vault-auth' }
  )
)

export const selectIsAuthenticated = (state) => Boolean(state.token)
