import asyncHandler from '../utils/asyncHandler.js'
import { semanticSearch, findRelatedNotes } from '../services/searchService.js'

export const search = asyncHandler(async (req, res) => {
  const { q } = req.query
  const results = await semanticSearch(req.userId, q)
  res.status(200).json({ success: true, query: q, results })
})

export const getRelatedNotes = asyncHandler(async (req, res) => {
  const results = await findRelatedNotes(req.userId, req.params.id, { limit: 5 })
  res.status(200).json({ success: true, results })
})
