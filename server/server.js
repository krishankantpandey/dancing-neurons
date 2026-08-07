import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import noteRoutes from './routes/noteRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import errorHandler from './middleware/errorHandler.js'
import { warmUpEmbeddingModel } from './services/embeddingService.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*' }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Memory Vault API is running' }))

app.use('/api/auth', authRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/search', searchRoutes)

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Must be registered last — see server/middleware/errorHandler.js
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Memory Vault API listening on port ${PORT}`))
    // Fire-and-forget: don't block server startup on the model download/load,
    // but get it warm before the first real search/note request arrives.
    warmUpEmbeddingModel()
      .then(() => console.log('Embedding model ready'))
      .catch((err) => console.error('Failed to load embedding model:', err.message))
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message)
    process.exit(1)
  })
