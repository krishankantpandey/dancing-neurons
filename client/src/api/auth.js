import { apiFetch } from './client.js'

export const registerRequest = (name, email, password) =>
  apiFetch('/auth/register', { method: 'POST', body: { name, email, password } })

export const loginRequest = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { email, password } })

export const getMeRequest = () => apiFetch('/auth/me')
