import './CategoryBadge.css'

// One color per category keeps notes visually scannable at a glance across
// Dashboard, Categories, and Search — the badge is the same component
// everywhere so that mapping only lives in one place.
const CATEGORY_STYLES = {
  Idea: { bg: '#3a2f5c', fg: '#c9b6ff' },
  Thought: { bg: '#2f3a5c', fg: '#a8c1ff' },
  Movie: { bg: '#5c2f45', fg: '#ff9dc4' },
  Book: { bg: '#2f5c4a', fg: '#7fe0b8' },
  Quote: { bg: '#5c4f2f', fg: '#ffd98a' },
  Task: { bg: '#5c2f2f', fg: '#ff9a9a' },
  Observation: { bg: '#2f5c5c', fg: '#8ae8e8' },
  Learning: { bg: '#3f2f5c', fg: '#c0a8ff' },
}

export default function CategoryBadge({ category }) {
  const style = CATEGORY_STYLES[category] || { bg: '#333', fg: '#ccc' }

  return (
    <span
      className="category-badge"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {category}
    </span>
  )
}
