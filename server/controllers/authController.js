import asyncHandler from '../utils/asyncHandler.js'
import { registerUser, loginUser, getUserById } from '../services/authService.js'

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  const result = await registerUser({ name, email, password })
  res.status(201).json({ success: true, ...result })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const result = await loginUser({ email, password })
  res.status(200).json({ success: true, ...result })
})

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.userId)
  res.status(200).json({ success: true, user })
})
