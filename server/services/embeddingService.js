import { pipeline } from '@huggingface/transformers'

// Loading the model takes a couple of seconds and downloads ~130MB the first
// time it runs (cached afterwards under node's home dir). We only want to do
// that once per process, not once per request — hence this lazy singleton.
let extractorPromise = null

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5')
  }
  return extractorPromise
}

// bge models were trained asymmetrically: search *queries* benefit from this
// instruction prefix, while the notes being searched (the "passages") don't
// need one. Skipping this measurably hurts ranking quality — verified by
// hand against this project's own sample notes before adopting it.
const QUERY_INSTRUCTION = 'Represent this sentence for searching relevant passages: '

// Turns a string into a 384-number vector that captures its *meaning*.
// Texts with similar meaning end up as vectors that point in a similar
// direction — that's what makes semantic search possible (see similarity.js).
async function embedRaw(text) {
  const extractor = await getExtractor()

  // pooling: 'mean' collapses the model's per-token output into one vector
  // for the whole sentence. normalize: true scales it to unit length, which
  // is what lets a plain dot product act as cosine similarity later.
  const output = await extractor(text, { pooling: 'mean', normalize: true })

  return Array.from(output.data)
}

// Embeds a note's own text (title/content) — no instruction prefix.
export async function embed(text) {
  return embedRaw(text)
}

// Embeds a user's search query — uses the bge retrieval instruction prefix.
export async function embedQuery(text) {
  return embedRaw(QUERY_INSTRUCTION + text)
}

// Warms the model up at server start so the *first* real request isn't the
// one that pays the multi-second model-load cost.
export async function warmUpEmbeddingModel() {
  await getExtractor()
}
