import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
  getNoteSummary,
} from '../controllers/noteController.js'
import { getRelatedNotes } from '../controllers/searchController.js'

const router = Router()

router.use(auth) // every note route requires a logged-in user

router.get('/', listNotes)
router.post('/', createNote)
router.get('/:id', getNote)
router.put('/:id', updateNote)
router.delete('/:id', deleteNote)
router.get('/:id/related', getRelatedNotes)
router.post('/:id/summary', getNoteSummary)

export default router
