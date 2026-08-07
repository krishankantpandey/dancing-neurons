// A lightweight extractive summary: split into sentences, keep the ones
// whose embedding is closest to the *whole note's* embedding (i.e. the
// sentences most representative of the note's overall meaning). This reuses
// the same embedding model as search — no separate/paid summarization API
// needed. Swap this out for a real LLM call later without touching callers.
import { embed } from './embeddingService.js'
import { cosineSimilarity } from '../utils/similarity.js'

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function summarizeNote(note, sentenceCount = 2) {
  const sentences = splitSentences(note.content)

  if (sentences.length <= sentenceCount) {
    return note.content
  }

  const noteEmbedding = await embed(`${note.title}. ${note.content}`)
  const scored = await Promise.all(
    sentences.map(async (sentence) => ({
      sentence,
      score: cosineSimilarity(noteEmbedding, await embed(sentence)),
    }))
  )

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence)) // restore original order
    .map((s) => s.sentence)
    .join(' ')
}
