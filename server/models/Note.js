import mongoose from 'mongoose'

export const CATEGORIES = [
  'Idea',
  'Thought',
  'Movie',
  'Book',
  'Quote',
  'Task',
  'Observation',
  'Learning',
]

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    sublabel: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    // 384-dim vector from the bge-small embedding model. Regenerated
    // whenever title/content changes — see services/embeddingService.js.
    embedding: {
      type: [Number],
      default: [],
      select: false, // large field, excluded by default; opt in with .select('+embedding')
    },
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
)

export default mongoose.model('Note', noteSchema)
