# Memory Vault — Interview Guide

Everything here is written so you can explain it out loud, in your own
words, without reading off a script. Read it once, then try explaining each
section to a rubber duck (or a friend) before an interview.

## 1. What problem does this solve?

Regular notes apps are keyword filing cabinets: you can only find a note
again if you remember the exact words you used. Memory Vault is a personal
knowledge base where you can find something by describing what it *means*,
not what it *says*. You save "Interstellar has amazing time-dilation
scenes" once, and months later you can search "time travel movies" and it
still surfaces — because the search compares *meaning*, not text.

Under the hood, that's done with an AI embedding model that runs locally
(no external API calls, no per-request cost) plus a well-known piece of
vector math (cosine similarity) that any backend can implement without a
specialized vector database.

## 2. Why MongoDB?

- **Schema flexibility.** A "note" can be a movie, a quote, a task — each
  with a different shape of metadata (a movie might get a "genre" sublabel,
  a task might not need tags at all). MongoDB's document model doesn't force
  every row into identical columns the way a rigid SQL table would.
- **Arrays as a native type.** A note's `tags` and its 384-number
  `embedding` vector are both just arrays in the document — no separate
  join table needed, the way you'd need in a relational schema.
- **It pairs naturally with Node/Express** (Mongoose gives you schema
  validation without giving up the document model's flexibility) and with
  MongoDB Atlas for a zero-ops managed database, which matters for a
  portfolio project you want deployed and running, not self-hosted.

*(Honest trade-off to mention if asked: at real production scale you'd want
strong consistency guarantees a relational DB gives you "for free" — but
for a personal knowledge base with one owner per document, that's not a
constraint that bites.)*

## 3. Why Express?

- Minimal and unopinionated — you can see and explain every middleware in
  the request path (`cors`, `express.json()`, your own routes, the error
  handler), nothing is hidden by a framework's magic.
- Enormous ecosystem and documentation, which matters when you're learning
  backend for the first time and need to unblock yourself quickly.
- Trivial to layer cleanly: routes → controllers → services → models is a
  pattern you impose yourself, not something the framework forces or
  fights you on.

## 4. What is an embedding?

An embedding is a list of numbers (a **vector**) that represents the
*meaning* of a piece of text. Here, the model (`bge-small-en-v1.5`, ~130MB,
runs locally via `@huggingface/transformers`, no API key) turns any
sentence into 384 numbers. Two sentences with similar meaning get vectors
that point in a similar *direction* in that 384-dimensional space, even if
they don't share a single word.

Think of it like GPS coordinates for meaning: "Paris" and "France's
capital" would land near each other on the meaning-map, even though the
words share zero letters.

## 5. What is cosine similarity, and the actual math

Cosine similarity measures the **angle** between two vectors, ignoring
their length:

```
cosine_similarity(A, B) = (A · B) / (|A| × |B|)
```

Where `A · B` is the dot product (`Σ Aᵢ×Bᵢ`) and `|A|`, `|B|` are the
vectors' magnitudes (lengths). The result ranges from `-1` (opposite
meaning) to `1` (identical direction/meaning), with `0` meaning unrelated.

**Simplification used in this codebase:** every embedding is generated with
`normalize: true`, meaning every vector is already scaled to length 1
(`|A| = |B| = 1`). When both vectors are unit length, the formula collapses
to just the dot product:

```
cosine_similarity(A, B) = A · B      (when |A| = |B| = 1)
```

That's exactly what `server/utils/similarity.js` computes — a simple loop
multiplying and summing, no division needed. It's a small but genuine
optimization worth mentioning: normalizing once at embedding time makes
every later comparison cheaper.

**Calibration, from actually testing this model:** cosine scores from
`bge-small` don't spread across the full `-1..1` range the way the formula
suggests — unrelated text pairs still commonly score `0.28-0.40`, while
genuinely related pairs score `0.5-0.7+`. Real numbers measured against this
project's own sample notes:

| Note | Query | Cosine similarity |
|---|---|---|
| "Interstellar has amazing time-dilation scenes." | "time travel movies" | **0.68** |
| "Interstellar has amazing time-dilation scenes." | "quantum computing research papers" | 0.37 |
| "Be the change you wish to see in the world." | "inspirational life quotes" | **0.47** |
| "Buy groceries: milk, eggs, bread." | "things I need to pick up from the store" | **0.60** |

That's why `searchService.js` uses a tuned minimum score (not `0`) to filter
out noise, and why you rank by *relative* score rather than trusting any
absolute cosine value as "this is definitely a match."

## 6. Keyword search vs. semantic search

| | Keyword search | Semantic search (this app) |
|---|---|---|
| How it matches | Exact/partial string match (`LIKE '%time%'`, or a text index) | Compares meaning via embedding vectors |
| Finds "time travel movies" from "Interstellar has time-dilation scenes"? | ❌ No shared keywords | ✅ Yes — similar meaning |
| Cost per query | Cheap, no ML involved | Slightly more (one embedding inference + N comparisons) |
| Typo/synonym tolerant? | No | Yes, to a meaningful degree |
| Explainability | "Because your query text appears in the document" | "Because the AI judged these as semantically close" — less literal, harder to fully explain to a user |

Memory Vault only implements semantic search, deliberately, to make the
project's AI story unambiguous — a production app might combine both
(hybrid search) for the best of both worlds, which is a good thing to
mention if an interviewer pushes on trade-offs.

## 7. How data flows from UI to database (concrete walkthrough)

Say you type "Interstellar has amazing time-dilation scenes" into
NoteEditor and hit Save:

1. `NoteEditor.jsx` calls `useNotesStore().addNote(payload)`.
2. `notesStore.js` calls `createNoteRequest(payload)` (`api/notes.js`).
3. `api/client.js`'s `apiFetch` attaches the JWT from `authStore`, POSTs to
   `/api/notes`.
4. Express routes it through `noteRoutes.js` → `auth` middleware (verifies
   the JWT, sets `req.userId`) → `noteController.createNote`.
5. `noteService.createNote` validates the payload, calls
   `embeddingService.embed(title + content + sublabel)` to get a 384-number
   vector.
6. `Note.create({...payload, embedding})` writes the document to MongoDB
   Atlas.
7. The created note (JSON) flows back up through controller → HTTP response
   → `apiFetch` → `notesStore` (which prepends it to the cached list) →
   React re-renders `Dashboard` with the new note visible immediately.

Later, searching "time travel movies":
1. `SearchResults.jsx` reads `?q=` from the URL, calls `searchNotesRequest`.
2. `GET /api/search?q=...` → `auth` middleware → `searchController.search`.
3. `searchService.semanticSearch` embeds the query (with the retrieval
   instruction prefix), loads all of that user's notes with their stored
   embeddings, scores each with cosine similarity, filters/sorts, returns
   the top matches with scores.
4. The frontend renders each as a `NoteCard` showing a "% match" badge.

## 8. The 2-minute interview pitch

> "Memory Vault is a personal knowledge base — you save ideas, quotes,
> movies, books, whatever — and instead of only finding things by exact
> keyword, you can search by meaning. I built the full stack: a React
> frontend with mobile-first responsive design and offline PWA support, an
> Express/MongoDB backend with JWT auth, and the AI piece — I run a small
> open-source embedding model (bge-small, 384 dimensions) locally in the
> Node process, no external API calls or per-query cost. When you save a
> note, I embed its text and store the vector alongside it in MongoDB. When
> you search, I embed the query the same way and rank every note by cosine
> similarity — basically, how closely their meaning-vectors point in the
> same direction. I actually measured this against my own test notes:
> 'Interstellar has time-dilation scenes' scores 0.68 similarity against
> 'time travel movies' but only 0.37 against something unrelated like
> 'quantum computing,' which is a real, measurable gap I tuned a threshold
> around, not just a demo that happens to work once. I also added related-
> notes and an optional extractive AI summary that reuse the same embedding
> infrastructure. It's deployed as client on Vercel, API on Render, and
> MongoDB Atlas for the database, and it's installable as a PWA on
> Android/iPhone."

Adjust the details you emphasize based on whether the interviewer is more
frontend-, backend-, or AI-focused — the pitch above is deliberately
end-to-end so you can lead with whichever part matches the room.

## 9. Likely interview questions and answers

**Q: Why not just use a SQL `LIKE` query or a regex search?**
A: That only matches literal substrings. It can't connect "time travel
movies" to "time-dilation scenes" because they share almost no words. That
gap is exactly what embeddings solve — they compare meaning, not spelling.

**Q: Why generate embeddings locally instead of calling an API like
OpenAI's?**
A: No per-request cost, no API key/secret to manage, works offline, and
keeps user data from leaving the server. The trade-off is the local model
is smaller/less powerful than the largest hosted models — a reasonable
trade for a personal-scale app, and the embedding service is isolated
behind one function (`embed`/`embedQuery`) so swapping to a hosted API
later is a contained change.

**Q: What happens when a user has 100,000 notes? Won't scanning every note
be slow?**
A: Right now it's a brute-force scan — fine for a personal knowledge base
at hundreds-to-low-thousands of notes per user. At real scale, you'd swap
in a proper vector index (MongoDB Atlas Vector Search, or a dedicated
vector DB like Pinecone/pgvector) which does approximate nearest-neighbor
search instead of a full scan — same underlying math, indexed instead of
linear.

**Q: How do you keep user A from seeing user B's notes?**
A: Every note has a `userId` field, and every single database query in
`noteService`/`searchService` filters by `req.userId` (taken from the
verified JWT, never from client-supplied input). There's no endpoint that
accepts an arbitrary user ID from the request.

**Q: Why re-embed a note on every edit instead of just on creation?**
A: The embedding represents the note's *current* meaning. If you edit the
content and don't regenerate the embedding, search would keep matching the
note against its *old*, now-incorrect meaning.

**Q: What's the difference between the JWT and a traditional session?**
A: A session is a random ID the server looks up in its own store on every
request. A JWT is self-contained and signed — the server can verify it's
authentic (via `JWT_SECRET`) without a database lookup, at the cost of not
being trivially revocable before it expires. That statelessness is why it
scales easily across multiple server instances without a shared session
store.

**Q: How would you test this?**
A: Backend logic is isolated in `services/*.js` with no Express/HTTP
dependency, so it's unit-testable in isolation (call `createNote` directly
with a fake `userId`). For the AI piece specifically, you'd want a
regression test that asserts known query/note pairs stay above/below your
similarity threshold — otherwise a model or threshold change could quietly
break search relevance without any code "breaking."

**Q: What was the hardest part?**
A: Calibrating the similarity threshold. Naively I assumed a cosine score
near 0 meant "unrelated" the way the textbook formula implies, but testing
against real notes showed `bge-small` scores cluster in a narrower, higher
band — unrelated pairs still landed around 0.3-0.4. I had to actually run
comparisons against sample data to find a threshold that separated real
matches from noise, rather than trusting the math in the abstract.
