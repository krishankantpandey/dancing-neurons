// Wraps an async Express route handler so any thrown error (or rejected
// promise) is forwarded to next(err) automatically, instead of needing a
// try/catch in every single controller function.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler
