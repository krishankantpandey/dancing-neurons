import { Link } from 'react-router-dom'
import CategoryBadge from './CategoryBadge.jsx'
import './NoteCard.css'

// Shown across Dashboard, Categories, and Search — `score` is only present
// on search/related results (a 0-1 cosine similarity), so it's optional.
export default function NoteCard({ note, score }) {
  return (
    <Link to={`/notes/${note._id}/edit`} className="note-card">
      <div className="note-card__header">
        <CategoryBadge category={note.category} />
        {typeof score === 'number' && (
          <span className="note-card__score" title="Semantic similarity to your query">
            {Math.round(score * 100)}% match
          </span>
        )}
      </div>
      <h3 className="note-card__title">{note.title}</h3>
      <p className="note-card__content">{note.content}</p>
      {note.tags?.length > 0 && (
        <div className="note-card__tags">
          {note.tags.map((tag) => (
            <span key={tag} className="note-card__tag">#{tag}</span>
          ))}
        </div>
      )}
    </Link>
  )
}
