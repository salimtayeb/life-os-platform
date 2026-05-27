const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const dotenv = require('dotenv')

const authRoutes = require('./routes/auth')
const tasksRoutes = require('./routes/tasks')
const eventsRoutes = require('./routes/events')
const goalsRoutes = require('./routes/goals')
const moodRoutes = require('./routes/mood')
const focusRoutes = require('./routes/focus')
const aiRoutes = require('./routes/ai')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000



// Helmet ajoute des headers de sécurité automatiquement
app.use(helmet())

// Cors autorise le frontend à communiquer avec ce backend
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://life-os-platform.vercel.app',
    ]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const isLocal = origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost')
    const isPrivateNetwork = /^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01]))/.test(origin)
    if (isLocal || isPrivateNetwork || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true)
    }
    callback(new Error(`Origine non autorisée : ${origin}`))
  },
  credentials: true
}))

// Permet à Express de lire le JSON envoyé par le frontend
app.use(express.json())

// Morgan affiche chaque requête dans le terminal
app.use(morgan('dev'))

// -----------------------------------
// ROUTES
// -----------------------------------

app.use('/api/auth', authRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/mood', moodRoutes)
app.use('/api/focus', focusRoutes)
app.use('/api/ai', aiRoutes)

// -----------------------------------
// ROUTE DE TEST
// -----------------------------------

// Cette route sert uniquement à vérifier que le serveur fonctionne
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Life OS API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

// -----------------------------------
// GESTION DES ERREURS
// -----------------------------------

// Cette fonction intercepte toutes les erreurs de l'application
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    code: err.code || 'INTERNAL_ERROR'
  })
})

// -----------------------------------
// DÉMARRAGE DU SERVEUR
// -----------------------------------

const { execSync } = require('child_process')

app.listen(PORT, async () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`)
  console.log(`✓ Environnement : ${process.env.NODE_ENV}`)
  console.log(`✓ URL : http://localhost:${PORT}/api/health`)

  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('✓ Lancement des migrations Prisma...')
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✓ Migrations appliquées avec succès')
    } catch (error) {
      console.error('✗ Erreur lors des migrations:', error.message)
    }
  }
})

module.exports = app