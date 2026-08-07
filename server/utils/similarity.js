// Cosine similarity measures the angle between two vectors, ignoring their
// magnitude: 1 = pointing the same direction (same meaning), 0 = unrelated,
// -1 = opposite meaning. Because our embeddings are already normalized to
// unit length (see embeddingService.js), this reduces to a plain dot product.
export function cosineSimilarity(a, b) {
  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }
  return dot
}
