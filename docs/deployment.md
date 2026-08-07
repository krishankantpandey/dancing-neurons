# Memory Vault — Deployment Guide

Deploying three pieces: the database (MongoDB Atlas), the API (Render), and
the frontend (Vercel). Do them in that order — the API needs a database
connection string before it can start, and the frontend needs a live API
URL before it can be configured correctly.

## 1. MongoDB Atlas (database)

1. Go to mongodb.com/cloud/atlas and create a free account (or log in).
2. Create a new **free M0 cluster** (a few clicks — pick any cloud
   provider/region, the free tier is fine for this project).
3. **Database Access** (left sidebar) → *Add New Database User* → create a
   username/password (save these — you'll need them in the connection
   string). Use "Password" auth, not a temporary/certificate option.
4. **Network Access** (left sidebar) → *Add IP Address* → for the simplest
   path while testing, choose *Allow Access from Anywhere* (`0.0.0.0/0`).
   (For a real production app you'd restrict this to Render's outbound IPs,
   but Render's IPs aren't static on the free tier, so `0.0.0.0/0` is the
   pragmatic choice here — access is still gated by the database
   username/password.)
5. **Database** → *Connect* on your cluster → *Drivers* → copy the
   connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add a database name to the path (Mongoose creates it automatically on
   first write): `.../memory-vault?retryWrites=true...`
7. This full string is your `MONGODB_URI`.

## 2. Backend on Render

1. Push this repo to GitHub (if you haven't already).
2. In Render, **New +** → **Web Service** → connect your GitHub repo.
3. Configure:
   - **Root directory:** `server`
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free is fine to start (note: free instances spin
     down after inactivity, so the *first* request after idling — including
     the embedding model's warm-up — will be noticeably slow. Mention this
     if you demo it live.)
4. **Environment** tab → add:
   - `MONGODB_URI` = the connection string from step 1
   - `JWT_SECRET` = a long random string (generate one locally:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `CLIENT_URL` = your Vercel URL once you have it (step 3) — comma-
     separate multiple origins if needed. You can also come back and set
     this after deploying the frontend.
   - `PORT` — Render sets this automatically; you don't need to set it
     yourself (the app already reads `process.env.PORT`).
5. Deploy. Check the logs for `Memory Vault API listening on port ...` and
   `Embedding model ready`. Hit `https://<your-service>.onrender.com/api/health`
   to confirm it's live.

*(Railway is a fine alternative — same idea: root directory `server`,
build `npm install`, start `npm start`, same environment variables.)*

## 3. Frontend on Vercel

1. In Vercel, **Add New** → **Project** → import the same GitHub repo.
2. Configure:
   - **Root directory:** `client`
   - **Framework preset:** Vite
   - **Build command:** `npm run build` (default)
   - **Output directory:** `dist` (default)
3. **Environment Variables** → add:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`
4. Deploy. Once it's live, copy the Vercel URL and set it as `CLIENT_URL`
   back on Render (step 2.4) so CORS allows requests from your real
   frontend origin, then redeploy the Render service so the new env var
   takes effect.

## 4. Verifying the deployed app

- Visit the Vercel URL, register a new account, create a note, then search
  for it using a *related but different* phrase (not the exact words) to
  confirm semantic search works against the live embedding model.
- On a phone, open the Vercel URL in the browser and use "Add to Home
  Screen" (Safari on iOS) or the install prompt (Chrome on Android) to
  confirm the PWA installs and launches in standalone mode.
- Open the browser's DevTools → Application tab → Service Workers /
  Manifest to double check both are registered on the deployed origin.

## 5. Environment variable reference

**`server/.env`**
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/memory-vault
JWT_SECRET=<long random string>
PORT=5000
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

Both directories have a `.env.example` with the same keys — copy it to
`.env` and fill in real values; `.env` itself is gitignored so secrets never
get committed.
