import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = '7d'

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

function toPublicUser(user) {
  return { id: user._id, name: user.name, email: user.email }
}

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AppError('name, email and password are required', 400)
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400)
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    throw new AppError('An account with that email already exists', 409)
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({ name, email, passwordHash })

  return { token: signToken(user._id), user: toPublicUser(user) }
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AppError('email and password are required', 400)
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401)
  }

  return { token: signToken(user._id), user: toPublicUser(user) }
}

export async function getUserById(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }
  return toPublicUser(user)
}
