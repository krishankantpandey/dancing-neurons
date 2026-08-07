import Note from '../models/Note.js'
import AppError from '../utils/AppError.js'
import { embedQuery } from './embeddingService.js'
import { cosineSimilarity } from '../utils/similarity.js'

const DEFAULT_LIMIT = 10
// bge-small cosine scores run in a narrower, higher-shifted band than raw
// cosine similarity intuition suggests — unrelated pairs still land around
// 0.28-0.4, true matches around 0.5-0.7. Tuned by hand against sample notes
// (see docs/interview-guide.md for the numbers); below this a "match" is
// more noise than signal.
const MIN_SCORE = 0.42

// Ranks `candidates` (Mongo docs with an .embedding field) against a query
// vector and returns the top matches, each annotated with its similarity score.
function rankByEmbedding(queryEmbedding, candidates, { limit, excludeId } = {}) {
  return candidates
    .filter((note) => !excludeId || String(note._id) !== String(excludeId))
    .map((note) => ({
      note,
      score: cosineSimilarity(queryEmbedding, note.embedding),
    }))
    .filter((result) => result.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || DEFAULT_LIMIT)
}

// This is a brute-force scan: fine for a personal knowledge base (hundreds to
// low thousands of notes per user). At a much larger scale you'd swap this
// for a vector index (e.g. MongoDB Atlas Vector Search) — same math, faster lookup.
export async function semanticSearch(userId, query, options = {}) {
  if (!query || !query.trim()) {
    throw new AppError('Query parameter "q" is required', 400)
  }

  const queryEmbedding = await embedQuery(query)
  const candidates = await Note.find({ userId }).select('+embedding')

  const ranked = rankByEmbedding(queryEmbedding, candidates, options)

  return ranked.map(({ note, score }) => ({
    ...note.toObject({ getters: true, versionKey: false }),
    embedding: undefined,
    score: Number(score.toFixed(4)),
  }))
}

export async function findRelatedNotes(userId, noteId, options = {}) {
  const source = await Note.findOne({ _id: noteId, userId }).select('+embedding')
  if (!source) {
    throw new AppError('Note not found', 404)
  }

  const candidates = await Note.find({ userId }).select('+embedding')
  const ranked = rankByEmbedding(source.embedding, candidates, { ...options, excludeId: noteId })

  return ranked.map(({ note, score }) => ({
    ...note.toObject({ getters: true, versionKey: false }),
    embedding: undefined,
    score: Number(score.toFixed(4)),
  }))
}
