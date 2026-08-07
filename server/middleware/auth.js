import jwt from 'jsonwebtoken'
import AppError from '../utils/AppError.js'

// Protects a route: expects "Authorization: Bearer <token>", verifies the
// JWT, and attaches the decoded user id to req.userId for downstream
// controllers to scope their DB queries to the logged-in user.
export default function auth(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Not authenticated', 401)
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.userId
    next()
  } catch {
    throw new AppError('Invalid or expired token', 401)
  }
}
