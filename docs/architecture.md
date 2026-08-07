# Memory Vault — Architecture

This document explains how data moves through Memory Vault: frontend, backend,
database, authentication, semantic search, and the PWA layer. Read it after
you've skimmed the code — it's meant to connect the pieces, not replace
reading `server/` and `client/src/`.

## 1. High-level shape

```
┌─────────────┐        HTTPS/JSON        ┌──────────────┐        Mongoose        ┌──────────────┐
│   Browser    │  ───────────────────▶   │  Express API  │  ──────────────────▶  │  MongoDB      │
│  (React SPA) │  ◀───────────────────   │  (Node.js)    │  ◀──────────────────  │  Atlas        │
└─────────────┘                          └──────────────┘                        └──────────────┘
       │                                        │
       │ installs as a PWA                      │ embeds text locally
       ▼                                        ▼
 Service worker                     @huggingface/transformers
 (offline app shell,                  (bge-small-en-v1.5,
  cached GET /api/*)                   runs in-process, no external API)
```

Three tiers, each replaceable independently:
- **client/** — Vite + React SPA. Talks to the API over `fetch`, never touches MongoDB directly.
- **server/** — Express REST API. Owns all business logic, auth, and the embedding model.
- **MongoDB Atlas** — stores users and notes (including each note's embedding vector).

## 2. Backend flow: routes → controllers → services → models

Every feature follows the same layering, visible in `server/`:

```
routes/noteRoutes.js        "which URL maps to which function, and is auth required?"
   → controllers/noteController.js   "translate HTTP req/res to plain function calls"
       → services/noteService.js     "the actual business logic and validation"
           → models/Note.js          "the Mongoose schema — what a note looks like in Mongo"
```

Why split controller from service? The service functions (`createNote`,
`updateNote`, ...) don't know anything about Express — no `req`, no `res`.
That means the same logic could be reused by a CLI script, a test, or a
different transport (GraphQL, gRPC) without rewriting it. The controller's
only job is "unwrap the HTTP request, call the service, shape the HTTP
response."

Errors flow upward as a thrown `AppError(message, statusCode)`
(`server/utils/AppError.js`). Every controller is wrapped in `asyncHandler`
(`server/utils/asyncHandler.js`), which catches both sync throws and rejected
promises and forwards them to `next(err)`. That lands in
`server/middleware/errorHandler.js` — the one place in the whole app that
decides what error shape the client sees. This is why no controller has a
`try/catch` of its own.

## 3. Authentication flow

```
Register/Login
  Browser ──POST /api/auth/register {name,email,password}──▶ authController.register
                                                                  ▼
                                              authService.registerUser
                                                  1. hash password with bcrypt
                                                  2. create User document
                                                  3. sign a JWT: { userId } → token
                                                  ▼
  Browser ◀── { token, user } ──────────────────────────────

Every subsequent request
  Browser ──Authorization: Bearer <token>──▶ middleware/auth.js
                                                  1. verify JWT signature + expiry
                                                  2. attach req.userId
                                                  ▼
                                             controller runs, scoped to req.userId
```

The frontend never stores the password — only the JWT, kept in
`client/src/store/authStore.js` (a Zustand store persisted to
`localStorage`). `client/src/api/client.js` reads that token on every request
and attaches the `Authorization` header automatically, so individual API
call sites (`api/notes.js`, `api/auth.js`) never think about auth at all.
`ProtectedRoute.jsx` gates the authenticated part of the router: no token →
redirect to `/login`.

If any request comes back `401` (expired/invalid token), `apiFetch` proactively
logs the user out client-side, so a stale token can't get the UI stuck
retrying forever.

## 4. Semantic search flow — the core feature

This is what makes Memory Vault different from a plain notes app: search
matches on **meaning**, not exact words.

### 4a. When a note is created or edited

```
noteService.createNote(title, content, sublabel, ...)
   → text = `${title}. ${content}. ${sublabel}`
   → embeddingService.embed(text)
       → loads Xenova/bge-small-en-v1.5 once per server process (lazy singleton)
       → runs the text through the model → 384 numbers (a "vector")
       → normalizes it to unit length
   → Note.embedding = that vector, saved alongside the note in MongoDB
```

The embedding is regenerated on every edit that touches title/content/sublabel —
otherwise search would keep matching on stale text.

### 4b. When the user searches

```
GET /api/search?q=time+travel+movies
   → searchService.semanticSearch(userId, "time travel movies")
       1. embeddingService.embedQuery(query)   ← note the *Query* variant, see below
       2. load all of this user's notes (with their stored embeddings)
       3. cosineSimilarity(queryVector, noteVector) for every note
       4. drop anything below a minimum score (see docs/interview-guide.md for the number)
       5. sort by score, descending
       6. return the top N, each annotated with its score
```

**Why `embedQuery` is different from `embed`:** bge models are trained
*asymmetrically* — they expect a short instruction prefix
(`"Represent this sentence for searching relevant passages: "`) on the query
side only, not on the documents being searched. Skipping this measurably
hurts ranking quality; the exact numbers from testing this project's own
sample notes are in `docs/interview-guide.md`.

**Why cosine similarity, not Euclidean distance or a database `LIKE` query:**
Euclidean distance cares about vector *magnitude*; cosine similarity only
cares about *direction*, which is what encodes meaning here. Because both
vectors are already unit-length, cosine similarity reduces to a plain dot
product (`server/utils/similarity.js`) — cheap to compute per note.

**Why brute-force, not a vector index:** for a personal knowledge base
(hundreds to low-thousands of notes per user), scanning every note and
scoring it is fast enough and needs zero extra infrastructure. At real scale
you'd swap this for MongoDB Atlas Vector Search or a dedicated vector DB —
same math (cosine similarity over embeddings), just indexed instead of scanned.
That swap only touches `searchService.js`; nothing else in the app changes.

### 4c. Related notes

`GET /api/notes/:id/related` reuses the exact same ranking function
(`rankByEmbedding` in `searchService.js`), except the "query vector" is the
target note's own embedding instead of a freshly embedded search string —
so a note's neighbors are just "other notes whose meaning points the same
direction."

### 4d. Optional AI summary

`POST /api/notes/:id/summary` (`server/services/summaryService.js`) is a
lightweight *extractive* summary: split the note into sentences, embed each
one, and keep the sentences whose embedding is closest to the whole note's
embedding (i.e., the most representative ones) — reusing the same embedding
model instead of calling out to a separate summarization API. It's built to
be swapped for a real LLM call later without touching any caller.

## 5. Database flow

Two collections, defined in `server/models/`:

- **User** (`User.js`): `name`, `email` (unique), `passwordHash`, `createdAt`.
  Never stores a plaintext password.
- **Note** (`Note.js`): `userId` (indexed, scopes every query to its owner),
  `title`, `content`, `category` (enum), `sublabel`, `tags` (string array),
  `embedding` (384-number array, `select: false` by default since it's large
  and irrelevant to normal CRUD responses — only search/related code opts in
  with `.select('+embedding')`), plus Mongoose's automatic `createdAt`/`updatedAt`.

Every note query is filtered by `userId` at the service layer
(`Note.find({ userId, ... })`) — there is no endpoint that can return another
user's notes, even if you know their note's `_id`.

## 6. PWA flow

`vite-plugin-pwa` (configured in `client/vite.config.js`) does two things at
build time:
1. Generates a **web app manifest** (`manifest.webmanifest`) describing the
   app's name, icons, and `display: "standalone"` — what makes "Add to Home
   Screen" launch without browser chrome, like a native app.
2. Generates a **service worker** (`sw.js`) via Workbox that:
   - **precaches** the built JS/CSS/HTML (the "app shell") so the UI itself
     loads even with no network — this is what "offline app shell support"
     means. It does *not* mean your notes are available offline; it means
     the app's interface loads and can tell you you're offline, instead of a
     blank white screen.
   - applies a **NetworkFirst** strategy to `GET /api/*` calls: try the
     network, and only fall back to a previously cached response if the
     network fails within a timeout. Mutations (POST/PUT/DELETE) are never
     cached — they always require a live network round trip.

The service worker registers itself automatically (`registerType:
'autoUpdate'`) — no code in `main.jsx` is needed for that.

## 7. Frontend flow

```
main.jsx
  → App.jsx (React Router: public routes /login,/register + protected tree)
      → ProtectedRoute (redirects to /login if no JWT)
          → AppLayout (Sidebar on desktop / BottomNav+FAB on mobile, shared TopBar+SearchBar)
              → page components (Dashboard, NoteEditor, SearchResults, Categories, Profile)
                  → shared components (NoteCard, CategoryBadge, LoadingSpinner, EmptyState, ErrorBanner)
                  → Zustand stores (authStore, notesStore) for state
                  → api/*.js modules → apiFetch → Express API
```

Pages don't call `fetch` directly — they call a function from `api/notes.js`
or `api/auth.js`, which calls the shared `apiFetch` wrapper
(`api/client.js`). That's the one place that knows the API's base URL,
attaches the JWT, and turns a non-2xx response into a thrown `Error` with the
server's message — so every page's error handling is just a `try/catch`
around one function call.

## 8. A known, reviewed dependency risk

`npm audit` flags a few high/critical advisories in transitive dependencies
of `@huggingface/transformers` (`onnxruntime-node`'s zip extraction,
`sharp`'s image codec) with no upstream fix yet. Both only matter if the app
feeds **untrusted zip files or images** into those libraries — Memory Vault
only ever passes it plain text for feature-extraction, so this app's actual
attack surface from those advisories is effectively nil. Worth knowing about,
re-checking with `npm audit` periodically, and mentioning if it comes up —
but not worth blocking on.
