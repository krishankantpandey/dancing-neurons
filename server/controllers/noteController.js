import asyncHandler from '../utils/asyncHandler.js'
import * as noteService from '../services/noteService.js'
import { summarizeNote } from '../services/summaryService.js'

export const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.userId, req.body)
  res.status(201).json({ success: true, note })
})

export const listNotes = asyncHandler(async (req, res) => {
  const { category } = req.query
  const notes = await noteService.listNotes(req.userId, { category })
  res.status(200).json({ success: true, notes })
})

export const getNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.userId, req.params.id)
  res.status(200).json({ success: true, note })
})

export const updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.userId, req.params.id, req.body)
  res.status(200).json({ success: true, note })
})

export const deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote(req.userId, req.params.id)
  res.status(200).json({ success: true, message: 'Note deleted' })
})

export const getNoteSummary = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.userId, req.params.id)
  const summary = await summarizeNote(note)
  res.status(200).json({ success: true, summary })
})
