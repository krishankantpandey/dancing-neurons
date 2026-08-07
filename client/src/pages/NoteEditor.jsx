import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNotesStore } from '../store/notesStore.js'
import { CATEGORIES, getNoteRequest, getRelatedNotesRequest, getNoteSummaryRequest } from '../api/notes.js'
import NoteCard from '../components/NoteCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import './NoteEditor.css'

const EMPTY_FORM = { title: '', content: '', category: CATEGORIES[0], sublabel: '', tags: '' }

export default function NoteEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { addNote, editNote, removeNote } = useNotesStore()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [related, setRelated] = useState([])
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    let cancelled = false

    // Necessary (not just initial-mount) setState: `id` can change while this
    // component stays mounted — e.g. clicking a related note swaps /notes/:id
    // without unmounting NoteEditor — and loading must flip back to true then.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([getNoteRequest(id), getRelatedNotesRequest(id).catch(() => ({ results: [] }))])
      .then(([{ note }, { results }]) => {
        if (cancelled) return
        setForm({
          title: note.title,
          content: note.content,
          category: note.category,
          sublabel: note.sublabel || '',
          tags: (note.tags || []).join(', '),
        })
        setRelated(results)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [id, isEditing])

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      title: form.title,
      content: form.content,
      category: form.category,
      sublabel: form.sublabel,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    try {
      if (isEditing) {
        await editNote(id, payload)
      } else {
        await addNote(payload)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    try {
      await removeNote(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSummarize = async () => {
    setSummaryLoading(true)
    try {
      const { summary } = await getNoteSummaryRequest(id)
      setSummary(summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setSummaryLoading(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading note…" />

  return (
    <div className="note-editor">
      <h1>{isEditing ? 'Edit note' : 'New note'}</h1>

      <form className="note-editor__form" onSubmit={handleSubmit}>
        <label>
          Title
          <input type="text" value={form.title} onChange={updateField('title')} required />
        </label>

        <label>
          Content
          <textarea rows={6} value={form.content} onChange={updateField('content')} required />
        </label>

        <div className="note-editor__row">
          <label>
            Category
            <select value={form.category} onChange={updateField('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Sublabel <span className="note-editor__optional">(optional)</span>
            <input type="text" value={form.sublabel} onChange={updateField('sublabel')} placeholder="e.g. Sci-Fi" />
          </label>
        </div>

        <label>
          Tags <span className="note-editor__optional">(comma-separated)</span>
          <input type="text" value={form.tags} onChange={updateField('tags')} placeholder="space, physics, favorites" />
        </label>

        <ErrorBanner message={error} />

        <div className="note-editor__actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create note'}
          </button>
          {isEditing && (
            <button type="button" className="note-editor__delete" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </form>

      {isEditing && (
        <section className="note-editor__summary">
          <button type="button" onClick={handleSummarize} disabled={summaryLoading}>
            {summaryLoading ? 'Summarizing…' : 'AI Summary'}
          </button>
          {summary && <p className="note-editor__summary-text">{summary}</p>}
        </section>
      )}

      {isEditing && related.length > 0 && (
        <section className="note-editor__related">
          <h2>Related notes</h2>
          <div className="note-editor__related-grid">
            {related.map((note) => (
              <NoteCard key={note._id} note={note} score={note.score} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
