// A custom Error subclass that carries an HTTP status code alongside a
// message, so route handlers can `throw new AppError(...)` and the
// centralized error middleware knows exactly what status to send back.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // distinguishes "expected" errors (bad input, not found) from bugs
  }
}

export default AppError
