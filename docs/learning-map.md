# Memory Vault — Learning Map

A map of every concept this project actually uses, tied to the specific
file where you can see it in action, plus what to study next to go deeper.
Use this as a checklist: for each row, can you explain it out loud without
looking at the code?

## React concepts used

| Concept | Where |
|---|---|
| Function components + hooks (`useState`, `useEffect`) | Every file in `client/src/pages/` |
| Controlled form inputs | `Login.jsx`, `Register.jsx`, `NoteEditor.jsx` |
| Effects with cleanup / race-condition guards (`cancelled` flag) | `NoteEditor.jsx`, `SearchResults.jsx` |
| Client-side routing, protected routes, `<Outlet/>` | `App.jsx`, `ProtectedRoute.jsx`, `AppLayout.jsx` |
| URL state via `useSearchParams` (shareable search queries) | `SearchResults.jsx`, `SearchBar.jsx` |
| Global state without Context: Zustand stores | `store/authStore.js`, `store/notesStore.js` |
| Persisting state to `localStorage` | `authStore.js`'s `persist` middleware |
| Component composition / shared UI primitives | `components/NoteCard.jsx`, `EmptyState.jsx`, `LoadingSpinner.jsx` |
| Mobile-first responsive CSS via media queries (no framework) | `layouts/AppLayout.css`, `components/Sidebar.css`, `BottomNav.css` |
| Loading / empty / error UI states as first-class render branches | `Dashboard.jsx`, `SearchResults.jsx`, `Categories.jsx` |

**What to study next:** `useReducer` for more complex form state,
`React.memo`/`useMemo` for render performance once lists get large,
React's Suspense + data-fetching patterns (what libraries like React Query
or Relay solve that hand-rolled `useEffect` fetching doesn't).

## Express concepts used

| Concept | Where |
|---|---|
| Routers, mounting sub-routers on a path prefix | `server.js` (`app.use('/api/notes', noteRoutes)`) |
| Middleware chain (global + per-route) | `cors()`, `express.json()`, `auth` middleware in every protected route |
| Centralized error-handling middleware (4-arg signature) | `middleware/errorHandler.js` |
| Route params vs. query params | `:id` in `noteRoutes.js` vs. `?q=`/`?category=` in controllers |
| Layered architecture: routes/controllers/services/models | The whole `server/` folder structure |
| Environment-based configuration | `.env` + `dotenv`, `process.env.MONGODB_URI` etc. |

**What to study next:** rate limiting (`express-rate-limit`) and request
validation libraries (`zod`, `joi`) to replace the hand-written validation
in `noteService.js`/`authService.js`; how a reverse proxy (Nginx) or
platform (Render) sits in front of Express in production.

## MongoDB / Mongoose concepts used

| Concept | Where |
|---|---|
| Schemas with types, `required`, `enum`, `default` | `models/User.js`, `models/Note.js` |
| References between collections (`ObjectId` + `ref`) | `Note.userId` referencing `User` |
| Indexes for query performance | `userId: { index: true }` on `Note` |
| `select: false` to exclude large fields by default | `Note.embedding` |
| Timestamps (`createdAt`/`updatedAt`) auto-management | `{ timestamps: true }` on `Note` |
| Scoping every query to the authenticated owner | `Note.find({ userId, ... })` everywhere in `noteService.js` |
| Storing an array of numbers as a document field | `Note.embedding` |

**What to study next:** MongoDB Atlas Vector Search (a purpose-built index
for exactly the embedding-similarity search this project does by brute
force), aggregation pipelines, schema design trade-offs (embedding vs.
referencing) at larger scale.

## JWT / auth concepts used

| Concept | Where |
|---|---|
| Password hashing (never storing plaintext) | `bcryptjs` in `authService.js` |
| Signing a token with a server-only secret | `jwt.sign({ userId }, JWT_SECRET, ...)` |
| Verifying + decoding on protected requests | `middleware/auth.js` |
| Stateless auth (no server-side session store) | The whole auth flow — nothing is stored server-side per login |
| Client-side token storage + attaching it to requests | `authStore.js` + `api/client.js` |
| Handling expiry/invalidity gracefully | `apiFetch`'s 401 handling → auto-logout |

**What to study next:** refresh tokens (this project uses a single
long-lived token for simplicity — a production app typically pairs a
short-lived access token with a longer-lived refresh token), token
revocation strategies, HttpOnly cookies vs. `localStorage` for token
storage (a real trade-off worth understanding: this project's
`localStorage` approach is simple but vulnerable to XSS in a way an
HttpOnly cookie wouldn't be).

## AI / ML concepts used

| Concept | Where |
|---|---|
| Text embeddings (turning text into a meaning-vector) | `services/embeddingService.js` |
| Running a model locally, no external API | `@huggingface/transformers`, model `Xenova/bge-small-en-v1.5` |
| Asymmetric retrieval (query vs. passage embeddings) | `embed()` vs. `embedQuery()` in `embeddingService.js` |
| Vector normalization | `normalize: true` in the embedding call |
| Cosine similarity | `utils/similarity.js` |
| Threshold tuning from empirical testing, not guessing | `MIN_SCORE` in `searchService.js` (see `interview-guide.md` for the numbers) |
| Extractive summarization via embedding similarity | `services/summaryService.js` |

**What to study next:** how a full RAG (retrieval-augmented generation)
pipeline would extend this — instead of just returning matching notes,
you'd feed the top matches into an LLM prompt to generate a synthesized
answer; the difference between embedding models (this project) and
generative LLMs (what would power that); approximate nearest neighbor
algorithms (HNSW, IVF) that make vector search fast at scale.

## Suggested study order, if starting from "I know basic JS/React"

1. Solidify Express fundamentals (routing, middleware, error handling) by
   re-reading `server/server.js` top to bottom and tracing one request.
2. Learn Mongoose schema design by comparing `User.js` and `Note.js` —
   why does one reference the other?
3. Trace the JWT auth flow end-to-end (Section 3 of `architecture.md`)
   until you could draw it from memory.
4. Read `embeddingService.js` and `similarity.js` together — they're short,
   and understanding them unlocks the whole AI story of this project.
5. Only then worry about PWA/deployment — those matter for *shipping* the
   project, not for understanding it.
