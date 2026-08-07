import Note, { CATEGORIES } from '../models/Note.js'
import AppError from '../utils/AppError.js'
import { embed } from './embeddingService.js'

// What actually gets embedded: title carries a lot of meaning, content carries
// the detail. Concatenating both gives the model the fullest picture of what
// the note is "about" for semantic matching.
function textToEmbed(note) {
  return [note.title, note.content, note.sublabel].filter(Boolean).join('. ')
}

function validateCategory(category) {
  if (!CATEGORIES.includes(category)) {
    throw new AppError(`category must be one of: ${CATEGORIES.join(', ')}`, 400)
  }
}

export async function createNote(userId, data) {
  const { title, content, category, sublabel = '', tags = [] } = data

  if (!title || !content) {
    throw new AppError('title and content are required', 400)
  }
  validateCategory(category)

  const embedding = await embed(textToEmbed({ title, content, sublabel }))

  const note = await Note.create({
    userId,
    title,
    content,
    category,
    sublabel,
    tags,
    embedding,
  })

  return note
}

export async function listNotes(userId, { category } = {}) {
  const filter = { userId }
  if (category) filter.category = category
  return Note.find(filter).sort({ createdAt: -1 })
}

export async function getNoteById(userId, id) {
  const note = await Note.findOne({ _id: id, userId })
  if (!note) {
    throw new AppError('Note not found', 404)
  }
  return note
}

export async function updateNote(userId, id, data) {
  const note = await Note.findOne({ _id: id, userId })
  if (!note) {
    throw new AppError('Note not found', 404)
  }

  const { title, content, category, sublabel, tags } = data
  if (category !== undefined) validateCategory(category)

  if (title !== undefined) note.title = title
  if (content !== undefined) note.content = content
  if (category !== undefined) note.category = category
  if (sublabel !== undefined) note.sublabel = sublabel
  if (tags !== undefined) note.tags = tags

  // Content changed meaning, so the embedding must be regenerated —
  // otherwise semantic search would keep matching on stale text.
  if (title !== undefined || content !== undefined || sublabel !== undefined) {
    note.embedding = await embed(textToEmbed(note))
  }

  await note.save()
  return note
}

export async function deleteNote(userId, id) {
  const result = await Note.findOneAndDelete({ _id: id, userId })
  if (!result) {
    throw new AppError('Note not found', 404)
  }
}
