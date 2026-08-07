// Centralized error handler. Express recognizes this as an error middleware
// because it takes 4 arguments — it must be registered LAST, after all routes.
export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Something went wrong on the server'

  if (!err.isOperational) {
    // Unexpected (programmer) errors get logged with full detail for debugging.
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
  })
}
